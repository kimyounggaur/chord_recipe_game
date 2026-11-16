#!/usr/bin/env python3
"""Create self-contained instructional SVGs for the Chord Recipe rulebook."""
from pathlib import Path
from html import escape

OUT = Path(__file__).resolve().parents[2] / 'public' / 'assets' / 'rulebook'
OUT.mkdir(parents=True, exist_ok=True)
INK='#3d3026'; MUTED='#70604b'; TEAL='#28685d'; GOLD='#955c0f'; CREAM='#fffaf0'; PANEL='#fffdf7'; ROSE='#a4473d'; BLUE='#446c78'

def rect(x,y,w,h,fill=PANEL,stroke='#dfcfb2',radius=20,sw=2):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'
def text(x,y,s,size=26,fill=INK,weight=600,anchor='middle'):
    return f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="Noto Sans KR, Apple SD Gothic Neo, Malgun Gothic, sans-serif" font-size="{size}" font-weight="{weight}" fill="{fill}">{escape(str(s))}</text>'
def line(x1,y1,x2,y2,stroke='#a78b63',sw=3,dash=''):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{stroke}" stroke-width="{sw}" stroke-linecap="round" {dash}/>'
def arrow(x1,y1,x2,y2,colour=TEAL):
    return line(x1,y1,x2,y2,colour,4)+f'<path d="M{x2-10} {y2-8} L{x2} {y2} L{x2-10} {y2+8}" fill="none" stroke="{colour}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
def title(name,subtitle):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" role="img" aria-labelledby="title desc">'
      f'<title id="title">{escape(name)}</title><desc id="desc">{escape(subtitle)}</desc><defs>'
      '<linearGradient id="paper" x2="1" y2="1"><stop stop-color="#fffaf0"/><stop offset="1" stop-color="#f0e3ca"/></linearGradient>'
      '<linearGradient id="plate" x2="0" y2="1"><stop stop-color="#fffdfa"/><stop offset="1" stop-color="#efe3ca"/></linearGradient>'
      '<filter id="shadow" x="-20%" y="-20%" width="140%" height="160%"><feGaussianBlur in="SourceAlpha" stdDeviation="5" result="blur"/><feOffset in="blur" dx="0" dy="5" result="offsetBlur"/><feComponentTransfer in="offsetBlur" result="shadow"><feFuncA type="linear" slope="0.13"/></feComponentTransfer><feMerge><feMergeNode in="shadow"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
      '</defs><rect width="960" height="540" rx="30" fill="url(#paper)"/>'
      '<path d="M0 437 Q100 405 190 440 T390 445 T620 440 T960 430 V540 H0Z" fill="#e6d3ae" opacity=".46"/>'
      '<circle cx="893" cy="57" r="28" fill="#ead5a5" opacity=".58"/><circle cx="94" cy="472" r="35" fill="#d2dfc4" opacity=".5"/>'
      '<path d="M86 65 q12 -25 24 0 q-13 19 -24 0 M848 458 q12 -25 24 0 q-13 19 -24 0" fill="#b9cdaa" opacity=".65"/>'
      +text(60,71,name,40,TEAL,800,'start')+text(62,108,subtitle,22,MUTED,500,'start')
      +line(62,123,898,123,'#ddc9a9',2))
def badge(cx,cy,label,role,colour):
    return (f'<g filter="url(#shadow)"><circle cx="{cx}" cy="{cy}" r="66" fill="url(#plate)" stroke="{colour}" stroke-width="7"/>'
      f'<circle cx="{cx}" cy="{cy}" r="51" fill="#fff9eb" stroke="{colour}" stroke-opacity=".4" stroke-width="2"/></g>'
      +text(cx,cy+15,label,48,colour,800)+text(cx,cy+104,role,21,MUTED,600))
def band(s):
    return rect(90,442,780,48,'#edf4e8','#ccdfc4',16)+text(480,474,s,21,TEAL,700)
def chord(title_,subtitle,notes,roles,intervals,foot):
    b=title(title_,subtitle)
    for x,n,r,c in zip([218,480,742],notes,roles,[ROSE,GOLD,TEAL]): b+=badge(x,260,n,r,c)
    for x,t in zip([349,611],intervals):
        b+=arrow(x-41,259,x+34,259)+text(x,228,t,23,TEAL,800)
    b+=band(foot)
    return b+'</svg>'
def card(x,y,w,h,big,small,colour=TEAL):
    return rect(x,y,w,h,'#fffdf7','#e3d2b4',22)+f'<circle cx="{x+49}" cy="{y+50}" r="27" fill="{colour}" opacity=".14"/>'+text(x+49,y+59,big,23,colour,800)+text(x+91,y+44,small[0],24,INK,800,'start')+text(x+91,y+78,small[1],18,MUTED,500,'start')
def write(name,svg):
    (OUT/(name+'.svg')).write_text(svg,encoding='utf-8')

# Front-of-house, navigation, and the player's work surface.
s=title('코드 레시피 키친에 오신 걸 환영해요','주문을 읽고, 음 세 개를 골라 나만의 화음을 만들어요')
s+=rect(75,155,810,248,'#fffdf8','#dfcfb2',30)
s+=card(102,186,230,105,'1',('주문','목표 확인'),ROSE)+card(365,186,230,105,'2',('재료','음 고르기'),GOLD)+card(628,186,230,105,'3',('완성','듣고 확인'),TEAL)
s+=arrow(335,239,356,239)+arrow(599,239,620,239)+text(480,361,'근음  +  가운데 음  +  맨 위 음',27,INK,800)+band('작은 음 세 개가 하나의 화음이 돼요')
write('kitchen',s+'</svg>')

s=title('오늘의 주문을 확인해요','목표 화음을 먼저 확인하면 필요한 재료를 찾기 쉬워요')
s+=rect(150,153,660,260,PANEL,'#dbc4a0',24)+rect(372,137,216,37,'#d1b075','#b28d55',12)
s+=text(480,216,'오늘의 주문',24,MUTED,700)+text(480,276,'C 장3화음',48,TEAL,800)+text(480,324,'아래부터 세 음을 쌓아 보세요',25,INK,600)
s+=text(480,374,'근음 C  ·  가운데 음 E  ·  맨 위 음 G',24,ROSE,700)+band('주문마다 근음과 화음 종류를 확인해요')
write('orders',s+'</svg>')

write('slots',chord('세 개의 접시','접시를 누르면 음을 넣거나 바꿀 수 있어요',['C','E','G'],['① 근음','② 가운데 음 · 3음','③ 맨 위 음 · 5음'],['아래 간격','위 간격'],'선택된 접시가 지금 바꿀 자리예요'))
write('major',chord('장3화음 레시피','C 장3화음을 두 개의 3도로 쌓아요',['C','E','G'],['근음','3음','5음'],['4반음','3반음'],'장3도 + 단3도 = 장3화음  ·  근음 기준 0 · 4 · 7'))
write('minor',chord('단3화음 레시피','C 단3화음은 가운데 음이 E♭예요',['C','E♭','G'],['근음','3음','5음'],['3반음','4반음'],'단3도 + 장3도 = 단3화음  ·  근음 기준 0 · 3 · 7'))
write('diminished',chord('감3화음 레시피','단3도 두 개를 차례로 쌓아요',['C','E♭','G♭'],['근음','3음','5음'],['3반음','3반음'],'3 + 3 = 감3화음  ·  근음에서 맨 위 음까지 6반음'))
write('augmented',chord('증3화음 레시피','장3도 두 개를 차례로 쌓아요',['C','E','G♯'],['근음','3음','5음'],['4반음','4반음'],'4 + 4 = 증3화음  ·  근음에서 맨 위 음까지 8반음'))
write('intervals',chord('두 번째 간격의 출발점','두 간격은 각각 이웃한 음 사이에서 세어요',['C','E','G'],['근음','두 번째 출발점','맨 위 음'],['C → E','E → G'],'인접 간격 4 + 3과 근음 기준 0 · 4 · 7을 구분해요'))

# A piano with explicitly labelled chromatic black keys.
def piano(y=198, next_c=False):
    x=153; w=94; h=176; out=''
    for i,n in enumerate(['C','D','E','F','G','A','B']):
        out+=rect(x+i*w,y,w-3,h,'#fffdfa','#aa9a80',6)+text(x+i*w+45,y+h-18,n,23,INK,700)
    for after,n in [(0,'C♯'),(1,'D♯'),(3,'F♯'),(4,'G♯'),(5,'A♯')]:
        xx=x+(after+1)*w-27
        out+=rect(xx,y,51,105,'#3b3936','#242320',6)+text(xx+25,y+83,n,15,'#fffdfa',600)
    if next_c:
        out+=rect(x+7*w,y,w-3,h,'#fffdfa','#aa9a80',6)+text(x+7*w+45,y+h-18,'다음 C',19,INK,700)
    return out
s=title('음 재료를 골라요','건반 또는 큰 버튼 중 편한 방법을 선택할 수 있어요')+piano()
s+=rect(224,405,240,54,'#e6f1e8','#96b8a9',16)+text(344,440,'건반 모드',22,TEAL,800)+rect(496,405,240,54,'#fff8e9','#dec79c',16)+text(616,440,'큰 버튼 모드',22,INK,800)
s+=text(480,501,'접시 선택 → 음 선택 → 다음 접시',22,MUTED,700)
write('key-input',s+'</svg>')

s=title('반음 한 칸씩 세어요','가까운 건반으로 한 칸 이동할 때마다 반음 하나예요')+piano(193, True)
s+=arrow(153+2*94+47,382,153+3*94+45,382,ROSE)+arrow(153+6*94+47,382,153+7*94+45,382,TEAL)
s+=rect(150,405,310,52,'#fff3e8','#eac4ad',15)+text(305,439,'E → F : 1반음',23,ROSE,800)
s+=rect(500,405,310,52,'#edf4e8','#c4d7bb',15)+text(655,439,'B → 다음 C : 1반음',22,TEAL,800)
s+=text(480,501,'시작 건반은 세지 않고 이동한 칸만 세어요',21,MUTED,700)
write('semitone',s+'</svg>')

s=title('장3화음과 단3화음 비교','근음과 맨 위 음은 같고 가운데 음만 달라요')
for y,label,notes,sub in [(160,'장3화음',['C','E','G'],'4 + 3반음'),(302,'단3화음',['C','E♭','G'],'3 + 4반음')]:
    s+=rect(110,y,740,125,PANEL,'#e0d0b5',24)+text(218,y+74,label,25,TEAL,800)
    for x,n,c in zip([380,520,660],notes,[ROSE,GOLD,TEAL]):
        s+=f'<circle cx="{x}" cy="{y+62}" r="39" fill="#fff6e5" stroke="{c}" stroke-width="5"/>'+text(x,y+72,n,29,c,800)
    s+=text(770,y+70,sub,20,MUTED,700)
s+=band('E에서 E♭로 바뀌면 아래·위 간격이 함께 달라져요')
write('comparison',s+'</svg>')

s=title('같은 건반, 다른 이름','같은 음높이라도 화음에서는 음이름의 순서를 지켜요')
s+=rect(130,166,700,235,PANEL,'#ddc9aa',24)
s+=text(480,224,'같은 건반',25,MUTED,700)+text(310,311,'D♯',53,ROSE,800)+text(480,311,'=',51,MUTED,500)+text(650,311,'E♭',53,TEAL,800)
s+=text(480,365,'C 단3화음의 올바른 표기  C – E♭ – G',25,INK,800)+band('같은 소리여도 C → E → G의 3도 쌓기를 보여줘요')
write('spelling',s+'</svg>')

s=title('옥타브를 확인해요','같은 음이름이라도 높이가 다르면 다른 음이에요')
s+=rect(94,162,772,242,PANEL,'#dfcfb2',26)
for x,lab,sub,col in [(224,'G4','근음',ROSE),(480,'B4','3음',GOLD),(736,'D5','5음',TEAL)]:
    s+=badge(x,258,lab,sub,col)
s+=arrow(308,258,391,258)+arrow(568,258,647,258)+band('G4 – B4 – D5 : 위쪽 D는 5옥타브예요')
write('octave',s+'</svg>')

s=title('올림표와 내림표','♯은 반음 올리고, ♭은 반음 내려요')
s+=card(84,167,360,210,'♯',('올림표','기준 음에서 반음 위'),ROSE)
s+=card(516,167,360,210,'♭',('내림표','기준 음에서 반음 아래'),TEAL)
s+=text(264,323,'F → F♯',37,ROSE,800)+text(696,323,'E → E♭',37,TEAL,800)+band('검은 건반도 포함해 음높이를 한 칸 바꿔요')
write('accidental',s+'</svg>')

s=title('첫 요리 수업','한 번에 한 단계씩 따라가며 C 장·단3화음을 배워요')
for i,(x,lab,sub) in enumerate([(111,'1','C를 고르기'),(294,'2','E를 고르기'),(477,'3','G를 고르기'),(660,'4','듣고 비교')]):
    s+=rect(x,175,162,175,PANEL,'#ddcdb2',22)+f'<circle cx="{x+81}" cy="225" r="30" fill="{[ROSE,GOLD,TEAL,BLUE][i]}"/>'+text(x+81,234,lab,28,'white',800)+text(x+81,309,sub,19,INK,700)
    if i<3:s+=arrow(x+164,260,x+176,260)
s+=band('첫 수업은 안내된 순서대로 천천히 진행해요')
write('tutorial',s+'</svg>')

s=title('틀린 재료 수리하기','잘못된 음을 찾아 필요한 접시만 바꿔 보세요')
s+=rect(92,158,776,250,PANEL,'#e0d0b5',24)
s+=text(194,225,'현재',23,MUTED,700)+text(194,326,'목표',23,MUTED,700)
for y,notes in [(216,['C','E','G']),(318,['C','E♭','G'])]:
    for x,n,c in zip([365,510,655],notes,[ROSE,GOLD,TEAL]):s+=f'<circle cx="{x}" cy="{y}" r="39" fill="#fff7e8" stroke="{c}" stroke-width="5"/>'+text(x,y+10,n,29,c,800)
s+=f'<path d="M 518 261 L 518 271" stroke="{TEAL}" stroke-width="4"/><path d="M508 266 L518 276 L528 266" fill="none" stroke="{TEAL}" stroke-width="4"/>'
s+=text(770,273,'반음 내리기',18,TEAL,700)+band('C와 G는 유지하고 E만 E♭로 바꿔요')
write('repair',s+'</svg>')

s=title('틀려도 괜찮아요','선택한 음을 유지하면서 어떤 간격을 고칠지 알려줘요')
s+=rect(111,154,738,248,PANEL,'#dfcfb2',24)
s+=rect(154,184,650,83,'#fff1e6','#e4b89b',18)+text(182,220,'가운데 음을 다시 살펴봐요',27,ROSE,800,'start')+text(182,250,'지금 3반음  ·  목표 4반음',21,INK,600,'start')
s+=text(480,335,'틀린 접시 선택 → 음 바꾸기 → 다시 확인',24,TEAL,700)+band('기존에 맞힌 음은 그대로 두고 고칠 수 있어요')
write('feedback',s+'</svg>')

s=title('차례로 듣고 함께 들어요','구성음과 화음의 울림을 각각 살펴보세요')
s+=rect(96,157,768,244,PANEL,'#dfcfb2',24)
for x,n,c in [(200,'C',ROSE),(340,'E',GOLD),(480,'G',TEAL)]:s+=f'<circle cx="{x}" cy="{226}" r="37" fill="#fff6e5" stroke="{c}" stroke-width="4"/>'+text(x,236,n,27,c,800)
s+=arrow(243,226,293,226)+arrow(383,226,433,226)+text(674,228,'♪  차례로 듣기',26,INK,800)+text(480,330,'C + E + G   ♬   함께 듣기',29,TEAL,800)
s+=band('실제로 재생이 끝난 뒤 듣기 완료가 표시돼요')
write('listening',s+'</svg>')

s=title('소리 없이도 배울 수 있어요','음이름과 간격을 그림으로 살펴보고 확인해요')
s+=rect(136,158,688,239,PANEL,'#dfcfb2',24)
s+=f'<circle cx="{252}" cy="{253}" r="52" fill="#e4f0e7" stroke="{TEAL}" stroke-width="4"/>'
s+=f'<path d="M220 243 L235 243 L254 226 V280 L235 263 H220Z M269 232 L291 274 M291 232 L269 274" fill="none" stroke="{TEAL}" stroke-width="5" stroke-linecap="round"/>'
s+=text(565,235,'C – E – G',39,INK,800)+text(565,283,'4반음  +  3반음',27,TEAL,800)+text(565,328,'그림으로 확인하기',23,MUTED,700)
s+=band('소리를 듣지 않은 기록은 그림 확인으로 따로 남아요')
write('silent',s+'</svg>')

s=title('주방장의 힌트','차근차근 필요한 만큼만 열어 보세요')
for x,num,h,detail,col in [(104,'1','간격 힌트','몇 반음인지 살펴봐요',ROSE),(372,'2','반음 세기','이동한 칸을 세어요',GOLD),(640,'3','음 재료 공개','필요한 음을 보여줘요',TEAL)]:
    s+=rect(x,172,216,204,PANEL,'#dfcfb2',22)+f'<circle cx="{x+108}" cy="220" r="30" fill="{col}"/>'+text(x+108,229,num,26,'white',800)+text(x+108,286,h,22,INK,800)+text(x+108,323,detail,17,MUTED,600)
s+=band('스스로 생각해 보고, 필요할 때 힌트를 열어요')
write('hints',s+'</svg>')

s=title('24개의 주문에 도전해요','완성한 주문과 지금 도전할 주문을 확인할 수 있어요')
for i,(x,y,n,status,col) in enumerate([(115,168,'01','완료',TEAL),(360,168,'02','다음',GOLD),(605,168,'03','잠김','#a89a84'),(115,296,'04','잠김','#a89a84'),(360,296,'05','잠김','#a89a84'),(605,296,'06','잠김','#a89a84')]):
    s+=rect(x,y,220,105,PANEL,'#dfcfb2',18)+f'<circle cx="{x+45}" cy="{y+51}" r="29" fill="{col}"/>'+text(x+45,y+59,n,20,'white',800)+text(x+105,y+58,status,23,col,800,'start')
s+=band('앞 주문을 완성하면 다음 주문이 차례로 열려요')
write('missions',s+'</svg>')

s=title('나만의 레시피북','완성한 화음의 구성음과 간격을 다시 살펴봐요')
s+=rect(164,150,632,265,'#fff8e8','#cbb58e',28)+f'<path d="M480 151 V416" stroke="#d8c09a" stroke-width="4"/>'
s+=text(322,214,'C 장3화음',29,TEAL,800)+text(322,272,'C – E – G',30,INK,800)+text(322,329,'4 + 3반음',24,MUTED,700)
s+=text(638,214,'C 단3화음',29,ROSE,800)+text(638,272,'C – E♭ – G',30,INK,800)+text(638,329,'3 + 4반음',24,MUTED,700)+band('다시 듣거나 해당 레시피를 자유롭게 연습해요')
write('recipe-book',s+'</svg>')

s=title('편하게 학습 환경을 바꿔요','소리·큰 버튼·움직임을 내게 맞게 설정해요')
for y,big,name,desc in [(162,'♪','소리와 음량','음소거 또는 듣기 설정'),(255,'Aa','큰 버튼','쉽게 누르는 입력 버튼'),(348,'◌','움직임 줄이기','효과를 간결하게 표시')]:
    s+=card(146,y,668,85,big,(name,desc),TEAL)
s+=band('설정과 학습 기록은 이 기기의 브라우저에 저장돼요')
write('settings',s+'</svg>')

s=title('오프라인 주방','먼저 온라인으로 열어 필요한 파일을 준비해요')
s+=card(114,174,344,194,'1',('온라인 접속','앱과 필요한 자료 준비'),TEAL)
s+=card(502,174,344,194,'2',('오프라인 학습','저장된 범위에서 계속'),GOLD)
s+=text(286,315,'연결하여 준비',24,TEAL,800)+text(674,315,'열어 본 자료 활용',24,INK,800)+band('아직 열지 않은 삽화는 연결이 필요할 수 있어요')
write('offline',s+'</svg>')

# Transpose the same recipes to the new root D, with correct spelling.
s=title('다른 근음 D에서도 같은 원리','근음이 바뀌면 세 음을 새 근음에서 다시 쌓아요')
for y,label,notes,sub in [(160,'D 장3화음',['D','F♯','A'],'4 + 3반음'),(302,'D 단3화음',['D','F','A'],'3 + 4반음')]:
    s+=rect(90,y,780,125,PANEL,'#e0d0b5',24)+text(205,y+72,label,23,TEAL,800)
    for x,n,c in zip([388,525,662],notes,[ROSE,GOLD,TEAL]):
        s+=f'<circle cx="{x}" cy="{y+62}" r="39" fill="#fff6e5" stroke="{c}" stroke-width="5"/>'+text(x,y+72,n,29,c,800)
    s+=text(782,y+70,sub,20,MUTED,700)
s+=band('D–F♯–A와 D–F–A는 가운데 음과 간격이 달라요')
write('transpose',s+'</svg>')
