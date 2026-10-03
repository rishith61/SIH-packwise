"""Layer 1: hard constraints. A structure that breaks one is rejected with a reason ("Why not this?")."""
from __future__ import annotations

from dataclasses import dataclass

from .context import Scenario
from .lca_cost import Footprint
from .requirements import Requirements
from .types import StructureSpec

BAND_RANK = {"low": 0, "medium": 1, "high": 2}
KNOWN_CONSTRAINTS = (
    "recyclable:true", "mono_material:true", "compostable:true", "max_cost_band:<low|medium|high>",
    "exclude_material:<id or family>", "food_contact_grade:true", "max_gauge_um:<n>", "no_metallised:true",
)


@dataclass
class Constraint:
    raw: str
    key: str
    value: str


def parse_constraints(raw: list[str]) -> tuple[list[Constraint], list[str]]:
    parsed, warnings = [], []
    for item in raw:
        key, _, value = item.strip().partition(":")
        key, value = key.strip().lower(), value.strip()
        ok = (
            (key in ("recyclable", "mono_material", "compostable", "food_contact_grade", "no_metallised") and value.lower() in ("true", "false"))
            or (key == "max_cost_band" and value.lower() in BAND_RANK)
            or (key == "exclude_material" and value)
            or (key == "max_gauge_um" and value.replace(".", "", 1).isdigit())
        )
        if ok:
            parsed.append(Constraint(item, key, value))
        else:
            warnings.append(
                f"Hard constraint '{item}' isn't recognised and was ignored. Supported: {', '.join(KNOWN_CONSTRAINTS)}."
            )
    return parsed, warnings


def structure_pinholes(s: StructureSpec) -> float:
    """Gelbo flex pinholes (ASTM F392) for the structure: set by its most crack-prone barrier ply."""
    barrier = [m.gelbo_hi for m in s.materials if m.barrier_ply]
    value = max(barrier) if barrier else max(m.gelbo_hi for m in s.materials)
    if any(m.prop("flexToughener") for m in s.materials):
        value /= 2  # BOPA absorbs flex stress (Blueprint failure-mode matrix)
    return value


def check(s: StructureSpec, sc: Scenario, req: Requirements, fp: Footprint, constraints: list[Constraint]) -> list[str]:
    reasons: list[str] = []
    seal = s.seal_layer.material

    if seal.sealability == "none":
        reasons.append(f"The inner ply ({seal.name}) can't be heat-sealed.")
    if any(not m.prop("standards") for m in s.materials):
        reasons.append("A ply has no food-contact compliance reference (FSSAI 2018 / BIS resin standard).")

    if sc.is_produce and s.gas_mode == "barrier":
        reasons.append("A sealed high-barrier laminate would starve respiring produce of oxygen (no gas-exchange path).")
    if not sc.is_produce and s.gas_mode == "breathable":
        reasons.append("A breathable produce film gives no moisture or oxygen barrier for a non-respiring food.")

    if req.contamination_tolerant and seal.id == "LDPE":
        reasons.append("Standard LDPE sealant can't seal through oil or moisture on the seal jaws; "
                       "an mLLDPE or ionomer sealant is needed (Blueprint Challenge 2).")
    if req.acid_resistant and s.has("AL_FOIL") and not seal.prop("acidResistant"):
        reasons.append("Acidic, wet product can attack the aluminium foil through a non-acid-resistant sealant.")
    if sc.is_frozen:
        brittle = [m.name for m in s.materials if m.prop("brittleCold")]
        if brittle:
            reasons.append(f"{brittle[0]} turns brittle at frozen temperatures.")
    if s.gas_mode == "barrier":
        pinholes = structure_pinholes(s)
        if pinholes > req.max_pinholes:
            reasons.append(f"Flex-crack risk: up to {pinholes:g} Gelbo pinholes, above the {req.max_pinholes:g} limit "
                           f"for {sc.transport_stress} transport stress.")

    for c in constraints:
        v = c.value.lower()
        if c.key == "recyclable" and v == "true" and not fp.recyclable:
            reasons.append(f"Fails your constraint '{c.raw}': not a recyclable mono-material (EPR Category {fp.epr_category}).")
        elif c.key == "mono_material" and v == "true" and not fp.mono_material:
            reasons.append(f"Fails your constraint '{c.raw}': mixes polymer families.")
        elif c.key == "compostable" and v == "true" and not all(m.compostable for m in s.materials):
            reasons.append(f"Fails your constraint '{c.raw}': contains non-compostable plies.")
        elif c.key == "no_metallised" and v == "true" and any(m.metallized or m.non_plastic for m in s.materials):
            reasons.append(f"Fails your constraint '{c.raw}': contains a metallised or foil ply.")
        elif c.key == "max_cost_band" and BAND_RANK[fp.cost_band] > BAND_RANK[v]:
            reasons.append(f"Fails your constraint '{c.raw}': cost band is {fp.cost_band}.")
        elif c.key == "max_gauge_um" and s.total_gauge_um > float(c.value):
            reasons.append(f"Fails your constraint '{c.raw}': total gauge is {s.total_gauge_um:g} µm.")
        elif c.key == "exclude_material":
            hit = [m.name for m in s.materials if m.id.lower() == v or m.family.lower() == v]
            if hit:
                reasons.append(f"Fails your constraint '{c.raw}': contains {hit[0]}.")
    return reasons
