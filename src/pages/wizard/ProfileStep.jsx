import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useWizard } from '../../context/WizardContext';
import { useAnnounce } from '../../context/AnnouncerContext';
import { FOOD_CATEGORIES, PROFILE_FIELDS, RESPIRATION_CLASSES, SENSITIVITY_LEVELS } from '../../data/wizard';
import { validateProfile } from '../../lib/wizardModel';
import { useFocusOnMount } from '../../hooks/useFocusOnMount';
import { cx } from '../../utils/cx';
import Button from '../../components/Button';
import ChoiceGroup from '../../components/wizard/ChoiceGroup';
import Field from '../../components/wizard/Field';
import Notice from '../../components/wizard/Notice';
import ProvenanceBadge from '../../components/wizard/ProvenanceBadge';
import RangeField from '../../components/wizard/RangeField';
import Skeleton from '../../components/wizard/Skeleton';
import StepActions from '../../components/wizard/StepActions';
import fieldStyles from '../../components/wizard/Field.module.css';
import styles from './Wizard.module.css';

function ProfileSkeleton({ name }) {
  return (
    <div className={styles.page} aria-busy="true">
      <p className={styles.eyebrow}>Step 2 of 5</p>
      <h1 className={styles.title}>Loading {name || 'food'} profile…</h1>
      <p className="sr-only" role="status">Loading the default food profile.</p>
      <div className={cx(styles.panel, styles.section)} aria-hidden="true">
        <div className={styles.formGrid}>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className={styles.stack}>
              <Skeleton width="35%" />
              <Skeleton height={40} radius={8} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProfileStep() {
  const { state, loadCommodity } = useWizard();
  const load = state.commodityLoad;
  if (load.status === 'loading') return <ProfileSkeleton name={load.name} />;
  if (load.status === 'error') {
    return (
      <div className={styles.page}>
        <p className={styles.eyebrow}>Step 2 of 5</p>
        <h1 className={styles.title}>Food profile</h1>
        <div className={styles.section}>
          <Notice
            tone="danger"
            role="alert"
            title={`Couldn't load the profile for ${load.name}`}
            actions={(
              <>
                <Button size="sm" onClick={() => loadCommodity({ commodityId: load.commodityId, name: load.name })}>Try again</Button>
                <Button size="sm" variant="ghost" to="/analyze/commodity">Choose another food</Button>
              </>
            )}
          >
            {load.error?.message}
          </Notice>
        </div>
      </div>
    );
  }

  return <ProfileForm />;
}

function ProfileForm() {
  const { state, dispatch } = useWizard();
  const navigate = useNavigate();
  const announce = useAnnounce();
  const headingRef = useFocusOnMount();
  const [attempted, setAttempted] = useState(false);

  const { commodity, profile, notes, fieldErrors } = state;
  const { fields, meta, source } = profile;
  const clientErrors = validateProfile(state);
  const errorFor = (key) => fieldErrors['commodity.profile.' + key] || (attempted ? clientErrors[key] : null);
  const badgeFor = (key) => <ProvenanceBadge value={meta[key]?.provenance} confidence={meta[key]?.confidence} />;
  const set = (field) => (value) => dispatch({ type: 'profile/set', field, value });
  const freshProduce = fields.category === 'fresh_produce' || fields.respirationClass === 'high';

  function handleNext() {
    setAttempted(true);
    const keys = Object.keys(clientErrors);
    if (keys.length) {
      announce('Please fix the highlighted fields.');
      document.getElementById(keys[0] === 'commodityName' ? 'commodity-name' : 'profile-' + keys[0])?.focus();
      return;
    }
    navigate('/analyze/conditions');
  }

  const nameError = fieldErrors['commodity.commodityName'] || (attempted ? clientErrors.commodityName : null);

  return (
    <div className={styles.page}>
      <p className={styles.eyebrow}>Step 2 of 5</p>
      <h1 className={styles.title} tabIndex={-1} ref={headingRef}>
        Food profile{commodity.commodityName && !commodity.isCustom ? `: ${commodity.commodityName}` : ''}
      </h1>
      <p className={styles.sub}>
        {commodity.isCustom
          ? "Enter what you know about this food's properties. Leave a field empty if you're unsure. You can still continue, and the result will be flagged as lower confidence."
          : 'Typical values for this food. Edit anything that differs for your product; edited values are labelled so the result stays traceable.'}
      </p>
      {source && <p className={styles.meta}><strong>Source:</strong> {source}</p>}

      {notes?.description && (
        <div className={styles.notes}>
          <Notice tone="info" title="Your description">
            <p className={styles.notesText}>“{notes.description}”</p>
            {notes.tags?.length > 0 && (
              <ul className={styles.notesTags} aria-label="Tags">
                {notes.tags.map((t) => <li key={t}>{t}</li>)}
              </ul>
            )}
          </Notice>
        </div>
      )}

      <form className={cx(styles.panel, styles.section)} noValidate onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
        <div className={styles.formGrid}>
          {commodity.isCustom && (
            <Field id="commodity-name" label="Commodity name" error={nameError} className={styles.span2}>
              <input
                id="commodity-name"
                className={fieldStyles.input}
                type="text"
                maxLength={80}
                value={commodity.commodityName}
                aria-invalid={nameError ? 'true' : undefined}
                aria-describedby={nameError ? 'commodity-name-error' : undefined}
                onChange={(e) => dispatch({ type: 'commodity/rename', name: e.target.value })}
              />
            </Field>
          )}

          <ChoiceGroup
            className={styles.span2}
            name="profile-category"
            legend={PROFILE_FIELDS.category.label}
            options={FOOD_CATEGORIES}
            value={fields.category}
            onChange={set('category')}
            badge={badgeFor('category')}
            error={errorFor('category')}
          />

          {freshProduce && (
            <div className={styles.span2}>
              <Notice tone="info">This will activate Fresh Produce / MAP analysis.</Notice>
            </div>
          )}

          {['moisturePct', 'fatPct', 'ph'].map((key) => {
            const f = PROFILE_FIELDS[key];
            return (
              <RangeField
                key={key}
                id={'profile-' + key}
                label={f.label}
                unit={f.unit}
                min={f.min}
                max={f.max}
                step={f.step}
                value={fields[key]}
                onChange={set(key)}
                badge={badgeFor(key)}
                error={errorFor(key)}
              />
            );
          })}

          <ChoiceGroup
            name="profile-respirationClass"
            legend={PROFILE_FIELDS.respirationClass.label}
            options={RESPIRATION_CLASSES}
            value={fields.respirationClass}
            onChange={set('respirationClass')}
            badge={badgeFor('respirationClass')}
            error={errorFor('respirationClass')}
            hint="How actively the food keeps respiring after harvest."
          />
          <ChoiceGroup
            name="profile-oxidationSensitivity"
            legend={PROFILE_FIELDS.oxidationSensitivity.label}
            options={SENSITIVITY_LEVELS}
            value={fields.oxidationSensitivity}
            onChange={set('oxidationSensitivity')}
            badge={badgeFor('oxidationSensitivity')}
            error={errorFor('oxidationSensitivity')}
          />
        </div>
        <button type="submit" hidden>Next</button>
      </form>

      <StepActions backTo="/analyze/commodity" nextLabel="Next: conditions" onNext={handleNext} />
    </div>
  );
}
