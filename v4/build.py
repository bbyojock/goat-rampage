import json,re,sys
sys.path.insert(0,'.')
SRC='../pkg/goat-rampage/public/index.html'
s=open(SRC,encoding='utf8').read()
def rep(old,new,cnt=1):
    global s
    assert s.count(old)==cnt,(s.count(old),old[:60])
    s=s.replace(old,new)
# A. 확장 훅
rep('Yt=Object.values(Ot),','Yt=(window.__GOAT_EXT&&window.__GOAT_EXT(Ot),Object.values(Ot)),')
# B. 클래스 노출 + 체형
rep('class Pt{static generateAllAssets','class Pt{static __v4=(window.__PAG=this,0);static generateAllAssets')
rep('c=Z.id==="BRUTUS"||Z.id==="TITAN",h=Z.id==="DASH"||Z.id==="PHANTOM"','c=Z.id==="BRUTUS"||Z.id==="TITAN"||Z.body==="heavy",h=Z.id==="DASH"||Z.id==="PHANTOM"||Z.body==="slim"')
# C. 전투 규칙: 추가 스킬
rep('H.state==="HEADBUTT"?b.moves.headbutt:H.state==="SPECIAL"?b.moves.special:null',
    'H.state==="HEADBUTT"?(H.alt==="headbutt2"&&b.moves.headbutt2||b.moves.headbutt):H.state==="SPECIAL"?(H.alt==="special2"&&b.moves.special2||b.moves.special):null')
rep('if(b.special&&H.cooldowns.special<=0&&H.stamina>=K.moves.special.staminaCost){H.state="SPECIAL",H.stateFrame=0,H.hasHitCurrentMove=!1,H.stamina-=K.moves.special.staminaCost,H.cooldowns.special=K.moves.special.cooldownFrames,Z.push({type:"MOVE_START",attackerSlot:H.slot,moveType:"special",x:H.x,y:H.y});return}',
    'if(b.special&&H.cooldowns.special<=0){const _k=b.crouch&&H.grounded&&K.moves.special2?"special2":"special",_m=K.moves[_k];if(H.stamina>=_m.staminaCost){H.alt=_k==="special2"?"special2":"",H.state="SPECIAL",H.stateFrame=0,H.hasHitCurrentMove=!1,H.stamina-=_m.staminaCost,H.cooldowns.special=_m.cooldownFrames,Z.push({type:"MOVE_START",attackerSlot:H.slot,moveType:"special",alt:H.alt,x:H.x,y:H.y});return}}')
rep('if(b.headbutt&&H.cooldowns.headbutt<=0&&H.stamina>=K.moves.headbutt.staminaCost){H.state="HEADBUTT",H.stateFrame=0,H.hasHitCurrentMove=!1,H.stamina-=K.moves.headbutt.staminaCost,H.cooldowns.headbutt=K.moves.headbutt.cooldownFrames,Z.push({type:"MOVE_START",attackerSlot:H.slot,moveType:"headbutt",x:H.x,y:H.y});return}',
    'if(b.headbutt&&H.cooldowns.headbutt<=0){const _k=b.crouch&&H.grounded&&K.moves.headbutt2?"headbutt2":"headbutt",_m=K.moves[_k];if(H.stamina>=_m.staminaCost){H.alt=_k==="headbutt2"?"headbutt2":"",H.state="HEADBUTT",H.stateFrame=0,H.hasHitCurrentMove=!1,H.stamina-=_m.staminaCost,H.cooldowns.headbutt=_m.cooldownFrames,Z.push({type:"MOVE_START",attackerSlot:H.slot,moveType:"headbutt",alt:H.alt,x:H.x,y:H.y});return}}')
rep('b.hp=Math.max(0,b.hp-n),b.comboCount+=1','b.hp=Math.max(0,b.hp-n),Y.lifesteal&&(H.hp=Math.min(H.maxHp,H.hp+Math.round(n*Y.lifesteal))),Y.staminaDrain&&(b.stamina=Math.max(0,b.stamina-Y.staminaDrain)),b.comboCount+=1')
# D. CPU AI
rep('K.special=!0:t<.32*Y&&H.cooldowns.headbutt<=0?K.headbutt=!0:','(K.special=!0,Math.sin(Z*.37)>.1&&(K.crouch=!0)):t<.32*Y&&H.cooldowns.headbutt<=0?(K.headbutt=!0,Math.sin(Z*.53)>.3&&(K.crouch=!0)):')
# E. FighterView 텍스처 접미사
rep('sync(b){const Z=`goat_${b.characterId}`','sync(b){const Z=`goat_${b.characterId}${this.texSuffix||""}`')
# F. 캐릭터 선택 화면 (5열 x 2행)
a=s.index('Yt.forEach((t,f)=>{const c=f%3'); e='this.refreshSelectionUI()})}),this.add.rectangle(160,255'; b=s.index(e,a)
new=('Yt.forEach((t,f)=>{const c=f%5,h=Math.floor(f/5),r=355+c*142,n=178+h*158,e=Y.unlockedCharacters.includes(t.id),s=this.add.rectangle(r,n,134,146,1976635,.95).setStrokeStyle(3,e?4674921:3359061).setInteractive({useHandCursor:!0}).setDepth(15);'
 'this.cardBorders.set(t.id,s),this.add.image(r,n-30,`portrait_${t.id}`).setScale(.7).setDepth(16),'
 'this.add.text(r,n+22,t.name,{fontFamily:\'"Press Start 2P", monospace\',fontSize:"12px",color:e?"#f8fafc":"#94a3b8"}).setOrigin(.5).setDepth(16),'
 'this.add.text(r,n+42,`[${t.role}]`,{fontSize:"12px",color:t.colors.accent,fontStyle:"bold"}).setOrigin(.5).setDepth(16),'
 'this.add.text(r,n+60,e?`HP ${t.stats.maxHp}·SPD ${t.stats.runSpeed}`:"🔒 스토리 해금",{fontSize:"10px",color:e?"#cbd5e1":"#fbbf24"}).setOrigin(.5).setDepth(16),'
 's.on("pointerdown",()=>{ut.playSfx("CLICK"),this.selectingSlot===1?this.p1Char=t.id:this.p2Char=t.id,this.refreshSelectionUI()})}),this.add.rectangle(160,255')
s=s[:a]+new+s[b+len(e):]
rep('this.infoDesc=this.add.text(210,492,"",{fontSize:"13px"','this.infoDesc=this.add.text(210,486,"",{fontSize:"13px"')
rep('this.infoStats=this.add.text(210,520,"",{fontSize:"13px",color:"#38bdf8"})','this.infoStats=this.add.text(210,508,"",{fontSize:"12px",color:"#38bdf8",lineSpacing:4})')
rep('(${Y.moves.special.damage} DMG)`);','(${Y.moves.special.damage} DMG)`+(Y.moves.headbutt2?`\n스킬2: [↓+K] ${Y.moves.headbutt2.name} (${Y.moves.headbutt2.damage})  |  [↓+L] ${Y.moves.special2.name} (${Y.moves.special2.damage})`:""));')
# G. 스크립트 삽입
D=json.load(open('data.json',encoding='utf8'))
ext=open('ext.js',encoding='utf8').read().replace('/*DATA*/null',json.dumps(D,ensure_ascii=False,separators=(',',':')))
mark='<script>\n/* 모바일/파일 뷰어 호환'
assert s.count(mark)==1
s=s.replace(mark,'<script>\n'+ext+'\n</script>\n'+mark)
patch=open('v4-patch.js',encoding='utf8').read()
i=s.rindex('</body>'); s=s[:i]+'<script>\n'+patch+'\n</script>\n'+s[i:]
open('index.v4.html','w',encoding='utf8').write(s)
print('built',len(s))
