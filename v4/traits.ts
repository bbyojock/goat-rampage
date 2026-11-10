// v6: 캐릭터 고유 패시브 · 상태이상(화상/독/빙결/감전) · 버프 · 연타. 서버(shared)와 클라이언트가 같은 코드를 씁니다.
/* eslint-disable @typescript-eslint/no-explicit-any */
type F = any;

export const PASSIVES: Record<string, string> = {
  RAM: '결의 — 체력 30% 이하에서 피해 +22%',
  DASH: '질풍 — 연타 공격, 스태미나 빠르게 회복',
  BRUTUS: '광란 — 잃은 체력만큼 피해 증가 (최대 +40%)',
  VOLT: '감전 — 적중 시 상대를 감전(스태미나 소모)시키고 스태미나 +5 흡수',
  TITAN: '철갑 — 받는 피해 -12%, 방어 스킬 사용 시 장갑',
  PHANTOM: '급소 — 20% 확률로 치명타(피해 x1.6), 독',
  BLAZE: '점화 — 공격이 화상(지속 피해)을 입힌다',
  FROST: '서리 — 공격이 빙결(이동 둔화)을 건다, 받는 피해 -8%',
  SAGE: '재생 — 가만히 있으면 체력 회복, 독으로 갉아먹는다',
  LANCER: '창끝 — 먼 거리에서 맞히면 피해 +30%',
};

function fx(f: F) {
  if (!f.fx) f.fx = { burn: 0, poison: 0, freeze: 0, shock: 0, buff: 0, bk: '' };
  return f.fx;
}

/** 매 프레임: 상태이상·버프·패시브·연타 재장전 */
export function tick(f: F, def: F): void {
  const x = fx(f);
  if (x.burn > 0) { x.burn--; f.hp = Math.max(1, f.hp - 0.2); }
  if (x.poison > 0) { x.poison--; f.hp = Math.max(1, f.hp - 0.14); }
  if (x.shock > 0) { x.shock--; f.stamina = Math.max(0, f.stamina - 0.4); }
  if (x.freeze > 0) { x.freeze--; f.x -= f.vx * 0.45; }
  if (x.buff > 0) {
    x.buff--;
    if (x.bk === 'haste') {
      f.stamina = Math.min(f.maxStamina, f.stamina + 0.4);
      if (f.cooldowns.attack > 0) f.cooldowns.attack--;
      if (f.cooldowns.headbutt > 0) f.cooldowns.headbutt--;
      if (f.cooldowns.special > 0) f.cooldowns.special--;
    }
    if (x.buff === 0) x.bk = '';
  }
  if (f.characterId === 'SAGE' && f.state === 'IDLE' && f.hp < f.maxHp) f.hp = Math.min(f.maxHp, f.hp + 0.05);
  if (f.characterId === 'DASH') f.stamina = Math.min(f.maxStamina, f.stamina + 0.18);
  // 연타: 지정 간격마다 다시 맞힐 수 있게 함
  let mv: any = null;
  if (f.state === 'HEADBUTT') mv = (f.alt === 'headbutt2' && def.moves.headbutt2) || def.moves.headbutt;
  else if (f.state === 'SPECIAL') mv = (f.alt === 'special2' && def.moves.special2) || def.moves.special;
  else if (f.state === 'ATTACK') mv = def.moves.attack;
  if (mv && mv.multiHit && f.hasHitCurrentMove && f.stateFrame > mv.startupFrames &&
      f.stateFrame < mv.startupFrames + mv.activeFrames && (f.stateFrame - mv.startupFrames) % mv.multiHit === 0) {
    f.hasHitCurrentMove = false;
  }
}

/** 피해 배율 */
export function mod(a: F, d: F, m: any, events: any[]): number {
  let k = 1;
  const ax = a.fx || {}, dx = d.fx || {};
  if (ax.buff > 0 && ax.bk === 'overdrive') k *= 1.35;
  if (dx.buff > 0 && dx.bk === 'armor') k *= 0.55;
  const ai = a.characterId, di = d.characterId;
  if (ai === 'BRUTUS') k *= 1 + 0.4 * (1 - a.hp / a.maxHp);
  if (ai === 'RAM' && a.hp < a.maxHp * 0.3) k *= 1.22;
  if (ai === 'LANCER' && Math.abs(a.x - d.x) > 120) k *= 1.3;
  if (ai === 'PHANTOM' && ((Math.floor(a.x * 13 + d.x * 7 + d.hp * 3) % 100) + 100) % 100 < 20) {
    k *= 1.6;
    events.push({ type: 'CRIT', attackerSlot: a.slot, defenderSlot: d.slot, x: (a.x + d.x) / 2, y: d.y - 60 });
  }
  if (di === 'TITAN') k *= 0.88;
  if (di === 'FROST') k *= 0.92;
  return k;
}

/** 적중 후: 상태이상 부여, 패시브 */
export function hit(a: F, d: F, m: any, dmg: number, events: any[]): void {
  if (m.status) {
    const x = fx(d), t = m.status.t;
    x[t] = Math.max(x[t] || 0, m.status.f);
    events.push({ type: 'STATUS', attackerSlot: a.slot, defenderSlot: d.slot, status: t, x: d.x, y: d.y - 50 });
  }
  if (a.characterId === 'VOLT') a.stamina = Math.min(a.maxStamina, a.stamina + 5);
}

/** 기술 시작: 자기 버프 / 회복 */
export function start(f: F, m: any, events: any[]): void {
  if (m.buff) {
    const x = fx(f);
    x.bk = m.buff.k; x.buff = m.buff.f;
    events.push({ type: 'BUFF', attackerSlot: f.slot, buff: m.buff.k, x: f.x, y: f.y - 50 });
  }
  if (m.heal) {
    f.hp = Math.min(f.maxHp, f.hp + Math.round(f.maxHp * m.heal));
    events.push({ type: 'BUFF', attackerSlot: f.slot, buff: 'heal', x: f.x, y: f.y - 50 });
  }
}
