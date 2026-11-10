import json,re
s=open('index.v5.html',encoding='utf8').read()
def rep(old,new):
    global s
    assert s.count(old)==1,(s.count(old),old[:70]); s=s.replace(old,new)
def swap_script(marker,newcode):
    global s
    i=s.index('<script>\n'+marker); j=s.index('</script>',i)+len('</script>')
    s=s[:i]+'<script>\n'+newcode+'\n</script>'+s[j:]
D=json.load(open('data.json',encoding='utf8'))
traits=open('out/traits.js',encoding='utf8').read()
ext=open('ext2.js',encoding='utf8').read().replace('/*DATA*/null',json.dumps(D,ensure_ascii=False,separators=(',',':'))).replace('/*TRAITS*/',traits)
swap_script('/* GOAT RAMPAGE v4 — 신규 캐릭터 + 추가 스킬 데이터',ext)
swap_script('/* GOAT RAMPAGE v5',open('sfx.js',encoding='utf8').read()+'\n'+open('vfx2.js',encoding='utf8').read())
T='window.__GOAT_T.'
rep('H.invincibleFrames>0&&H.invincibleFrames--,H.comboTimerFrames','H.invincibleFrames>0&&H.invincibleFrames--,'+T+'tick(H,K),H.comboTimerFrames')
rep('n=Math.max(5,Math.round(Y.damage*K.stats.defense*r));','n=Math.max(5,Math.round(Y.damage*K.stats.defense*r*'+T+'mod(H,b,Y,Z)));')
rep('b.hp=Math.max(0,b.hp-n),Y.lifesteal','b.hp=Math.max(0,b.hp-n),'+T+'hit(H,b,Y,n,Z),Y.lifesteal')
rep('H.cooldowns.special=_m.cooldownFrames,Z.push(','H.cooldowns.special=_m.cooldownFrames,'+T+'start(H,_m,Z),Z.push(')
rep('H.cooldowns.headbutt=_m.cooldownFrames,Z.push(','H.cooldowns.headbutt=_m.cooldownFrames,'+T+'start(H,_m,Z),Z.push(')
rep('this.infoStats=this.add.text(210,508,"",{fontSize:"12px",color:"#38bdf8",lineSpacing:4})','this.infoStats=this.add.text(210,502,"",{fontSize:"12px",color:"#38bdf8",lineSpacing:2})')
rep('${Y.moves.special2.damage})`:""));','${Y.moves.special2.damage})`:"")+"\\n패시브: "+(window.__GOAT_T.PASSIVES[Y.id]||""));')
open('index.v6.html','w',encoding='utf8').write(s); print('built',len(s))
