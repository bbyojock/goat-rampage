import json
def mv(name,dmg,su,ac,rc,hs,bs,kx,ky,hst,cd,st,vx,vy,box,color,**ex):
    d=dict(name=name,damage=dmg,startupFrames=su,activeFrames=ac,recoveryFrames=rc,hitstunFrames=hs,blockstunFrames=bs,
      knockbackX=kx,knockbackY=ky,hitstopFrames=hst,cooldownFrames=cd,staminaCost=st,velocityBoostX=vx,velocityBoostY=vy,
      hitbox=dict(offsetX=box[0],offsetY=box[1],width=box[2],height=box[3]),effectColor=color)
    d.update(ex); return d
def hb(ox,oy,w,h): return dict(offsetX=ox,offsetY=oy,width=w,height=h)

ALT={
 'RAM':dict(
  headbutt2=mv('Rising Horn Uppercut',105,8,8,15,25,13,6,-12,8,42,19,4,-5,(46,-72,62,92),0x60a5fa),
  special2=mv("Guardian's Resolve",140,11,12,20,29,16,13,-7,9,96,36,10,-3,(64,-50,100,70),0xfbbf24,lifesteal=0.2)),
 'DASH':dict(
  headbutt2=mv('Slipstream Slide',82,5,9,11,20,10,7,-6,5,30,14,17,0,(48,-26,86,40),0x34d399),
  special2=mv('Cyclone Barrage',145,8,16,18,26,14,11,-6,8,84,34,14,-2,(50,-48,100,64),0x10b981)),
 'BRUTUS':dict(
  headbutt2=mv('Bull Stomp Quake',150,16,9,20,28,16,12,-9,10,54,26,5,-6,(40,-34,120,70),0xef4444),
  special2=mv('Berserk Rampage',180,16,12,22,32,18,16,-8,11,110,42,11,-2,(66,-50,96,70),0xdc2626,lifesteal=0.25)),
 'VOLT':dict(
  headbutt2=mv('Static Shock Bite',84,6,7,12,22,12,7,-4,6,32,15,9,0,(56,-46,70,50),0xfde047,staminaDrain=22),
  special2=mv('Thunder Cage',155,12,13,21,30,16,9,-5,10,104,38,3,0,(40,-50,126,84),0x38bdf8,isUnblockable=True,staminaDrain=35)),
 'TITAN':dict(
  headbutt2=mv('Bulwark Slam',138,16,9,19,27,16,14,-7,10,52,26,7,-1,(62,-48,84,64),0x94a3b8,isUnblockable=True),
  special2=mv('Titanquake',195,18,14,26,36,22,16,-11,12,140,46,3,-6,(30,-34,150,72),0x22d3ee)),
 'PHANTOM':dict(
  headbutt2=mv('Shade Step Slash',92,5,8,11,20,11,8,-4,6,32,15,6,0,(60,-46,76,50),0xc084fc,teleportOffsetX=90),
  special2=mv('Eclipse Reaper',178,12,12,19,31,17,16,-9,10,108,42,6,-2,(60,-48,92,66),0xf43f5e,isUnblockable=True,teleportOffsetX=190,lifesteal=0.2)),
}
def ch(id,title,role,desc,body,stats,colors,hurt,crouch,attack,headbutt,special,h2,s2):
    return dict(id=id,name=id,title=title,role=role,description=desc,unlockedByDefault=False,body=body,stats=stats,colors=colors,
      hurtbox=hurt,crouchHurtbox=crouch,moves=dict(attack=attack,headbutt=headbutt,special=special,headbutt2=h2,special2=s2))
def st(hp,sta,w,r,j,wt,df,dd,ds): return dict(maxHp=hp,maxStamina=sta,walkSpeed=w,runSpeed=r,jumpForce=j,weight=wt,defense=df,dodgeDurationFrames=dd,dodgeSpeed=ds)
def col(p,s,h,e,a): return dict(primary=p,secondary=s,horn=h,eye=e,accent=a)
NEW=[
 ch('BLAZE','불꽃의 돌격대장 (Rushdown)','공격형','체력은 낮지만 화력이 가장 높은 불꽃 염소. 맞으면 아프지만 몰아치면 끝납니다. 불사조 돌진으로 체력을 회복합니다.','normal',
  st(920,110,6.0,8.4,16.6,0.92,1.08,17,11.5),col('#fb923c','#9a3412','#fde047','#ef4444','#f97316'),
  hb(0,-44,72,88),hb(0,-30,76,60),
  mv('Ember Jab',60,5,5,9,15,8,6,-3,4,13,7,3.5,0,(56,-46,64,48),0xfb923c),
  mv('Flare Ram',112,9,9,14,23,13,13,-6,8,36,21,12.5,-1.5,(62,-48,78,56),0xf97316),
  mv('Inferno Meteor',175,13,12,19,30,17,16.5,-10,10,88,38,12,-8,(66,-52,90,70),0xef4444),
  mv('Cinder Uppercut',100,8,8,15,26,12,6,-12,8,44,20,4,-5,(46,-70,60,90),0xfdba74),
  mv('Phoenix Rush',150,10,12,20,28,16,14,-7,9,96,36,16,-3,(60,-48,92,66),0xfacc15,lifesteal=0.15)),
 ch('FROST','빙결의 수문장 (Counter)','방어형','단단한 빙결 갑옷으로 버티며 상대의 스태미나를 얼려 버리는 방어형. 가드를 깨고 얼음 감옥으로 몰아넣습니다.','heavy',
  st(1080,100,4.6,6.6,15.0,1.12,0.88,18,10.0),col('#bae6fd','#0369a1','#e0f2fe','#22d3ee','#38bdf8'),
  hb(0,-45,76,90),hb(0,-31,80,62),
  mv('Ice Pick Jab',62,6,6,10,16,9,6,-3,4,15,8,3,0,(56,-46,66,48),0x7dd3fc),
  mv('Glacier Charge',115,11,10,16,24,14,12,-6,8,38,22,10,-1.5,(62,-48,78,56),0x38bdf8,staminaDrain=12),
  mv('Absolute Zero',160,14,12,20,32,18,14,-8,10,92,38,9,-5,(68,-50,96,70),0x67e8f9,staminaDrain=30),
  mv('Frost Counter Bash',95,6,8,14,22,12,9,-5,7,40,18,7,0,(52,-44,74,52),0xbae6fd,staminaDrain=18),
  mv('Blizzard Prison',140,12,14,22,34,18,8,-4,10,110,40,5,0,(60,-50,130,80),0xe0f2fe,isUnblockable=True,staminaDrain=35)),
 ch('SAGE','숲의 현자 (Sustain)','회복형','맞히면 체력을 빨아들이는 회복형 현자. 길게 끌수록 유리합니다. 생명의 노바는 흡혈량이 가장 큽니다.','slim',
  st(940,110,5.4,7.6,16.0,0.96,1.0,18,11.0),col('#d9f99d','#4d7c0f','#fef3c7','#a3e635','#84cc16'),
  hb(0,-42,68,84),hb(0,-28,72,56),
  mv('Leaf Tap',54,5,5,8,15,8,5.5,-3,3,12,6,3,0,(54,-45,64,46),0xa3e635,lifesteal=0.05),
  mv('Sprout Lunge',100,9,9,13,22,12,11,-5.5,7,34,19,11,-1,(60,-47,76,54),0x84cc16,lifesteal=0.12),
  mv('Verdant Bloom',150,12,12,19,29,16,14,-8,9,84,36,9,-4,(64,-50,92,68),0x4ade80,lifesteal=0.22),
  mv('Thorn Sweep',88,7,8,12,21,11,8,-8,6,36,16,6,-2,(50,-30,84,40),0x65a30d,lifesteal=0.12),
  mv('Lifebloom Nova',130,12,12,20,28,16,12,-7,9,100,40,4,-2,(40,-48,120,80),0xbef264,lifesteal=0.4)),
 ch('LANCER','황금 창뿔 (Reach)','리치형','압도적인 사거리의 창뿔로 거리를 지배하는 기사. 접근을 허용하지 않으면 이깁니다. 심판의 창은 가드 불가.','normal',
  st(980,100,5.0,7.0,15.6,1.04,0.98,17,11.0),col('#cbd5e1','#475569','#facc15','#fb7185','#eab308'),
  hb(0,-44,74,88),hb(0,-30,78,60),
  mv('Lance Thrust',68,7,6,11,16,9,7,-3,4,17,8,3,0,(80,-46,104,34),0xfde047),
  mv('Piercing Charge',125,12,10,17,25,15,14,-6,8,40,23,12.5,-1,(86,-48,112,44),0xfacc15),
  mv('Dragon Lance Barrage',170,15,13,21,31,18,16,-9,10,92,38,13,-3,(96,-50,130,56),0xeab308),
  mv('Sky Pierce',110,10,9,16,26,13,8,-11,8,44,21,6,-7,(70,-80,80,100),0xfef08a),
  mv("Guardian's Judgement",185,18,12,22,34,20,17,-9,11,120,42,7,-2,(88,-50,128,60),0xf59e0b,isUnblockable=True)),
]
UNLOCK={'quest_gv_boss':'BLAZE','quest_df_boss':'SAGE','quest_sc_boss':'FROST','quest_il_boss':'LANCER'}
DATA=dict(new=NEW,alt=ALT,unlock=UNLOCK)
if __name__=='__main__':
    json.dump(DATA,open('data.json','w'),ensure_ascii=False)
    print(len(NEW),sum(len(v) for v in ALT.values()))

# ---- v6: 캐릭터별 고유 효과 덮어쓰기 (연타/상태이상/버프/회복). _x 는 기존 값에 곱합니다 ----
def st_(t,f): return {'t':t,'f':f}
def bf_(k,f): return {'k':k,'f':f}
MH_X={'knockbackX':.3,'knockbackY':.4}
PATCH={
 'RAM':{'special':{'buff':bf_('armor',90)},'special2':{'buff':bf_('armor',150),'heal':0.06}},
 'DASH':{'attack':{'activeFrames':8,'multiHit':4,'_x':{'damage':.58,'knockbackX':.5}},
         'special':{'activeFrames':18,'multiHit':4,'_x':dict(MH_X,damage=.3)},
         'headbutt2':{'buff':bf_('haste',150)},
         'special2':{'activeFrames':20,'multiHit':4,'buff':bf_('haste',180),'_x':dict(MH_X,damage=.3)}},
 'BRUTUS':{'special2':{'buff':bf_('overdrive',300)},'headbutt2':{'hitstunFrames':46}},
 'VOLT':{'attack':{'status':st_('shock',90)},'headbutt':{'status':st_('shock',150)},
         'special':{'activeFrames':15,'multiHit':5,'status':st_('shock',240),'_x':dict(MH_X,damage=.4)},
         'headbutt2':{'status':st_('shock',150)},
         'special2':{'activeFrames':16,'multiHit':4,'status':st_('shock',300),'_x':dict(MH_X,damage=.35)}},
 'TITAN':{'special':{'buff':bf_('armor',120)},'headbutt2':{'buff':bf_('armor',180)}},
 'PHANTOM':{'attack':{'status':st_('poison',60)},'special':{'status':st_('poison',180)},'special2':{'status':st_('poison',240)}},
 'BLAZE':{'attack':{'status':st_('burn',60)},'headbutt':{'status':st_('burn',150)},'special':{'status':st_('burn',240)},
          'headbutt2':{'status':st_('burn',120)},'special2':{'status':st_('burn',180)}},
 'FROST':{'attack':{'status':st_('freeze',40)},'headbutt':{'status':st_('freeze',90)},'special':{'status':st_('freeze',150)},
          'headbutt2':{'status':st_('freeze',120)},'special2':{'status':st_('freeze',210)}},
 'SAGE':{'attack':{'status':st_('poison',120)},'headbutt':{'status':st_('poison',180)},'special':{'status':st_('poison',240),'heal':0.05},
         'headbutt2':{'status':st_('poison',180)},'special2':{'status':st_('poison',240),'heal':0.12}},
 'LANCER':{'special':{'activeFrames':18,'multiHit':6,'_x':dict(MH_X,damage=.42)}},
}
DATA['patch']=PATCH
import json as _j
_j.dump(DATA,open('data.json','w',encoding='utf8'),ensure_ascii=False)
