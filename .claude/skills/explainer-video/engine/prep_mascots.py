from PIL import Image, ImageDraw
import base64, io, json, collections
src='C:/Users/Theo/Desktop/TAAMBETTER/public/characters/'
out={}
import sys
names=sys.argv[1:] or ['wave','famous','phone']
for name in names:
    im=Image.open(src+name+'.png').convert('RGBA').resize((600,600),Image.LANCZOS)
    W,H=im.size; px=im.load()
    lum=lambda p: (p[0]*0.3+p[1]*0.59+p[2]*0.11)*(p[3]/255)+255*(1-p[3]/255)
    outside=[[False]*W for _ in range(H)]
    q=collections.deque()
    for x in range(W):
        for y in (0,H-1): q.append((x,y))
    for y in range(H):
        for x in (0,W-1): q.append((x,y))
    while q:
        x,y=q.popleft()
        if x<0 or y<0 or x>=W or y>=H or outside[y][x]: continue
        if lum(px[x,y])<200: continue
        outside[y][x]=True
        q.extend(((x+1,y),(x-1,y),(x,y+1),(x,y-1)))
    xs=[x for y in range(H) for x in range(W) if not outside[y][x]]; ys=[y for y in range(H) for x in range(W) if not outside[y][x]]
    x0,x1,y0,y1=min(xs),max(xs),min(ys),max(ys)
    o=Image.new('RGBA',(W,H)); op=o.load()
    for y in range(H):
        for x in range(W):
            if outside[y][x]: continue
            l=lum(px[x,y])/255
            u=((x-x0)/(x1-x0+1))*0.55+((y-y0)/(y1-y0+1))*0.45
            tone=0.93-0.42*u   # lit from top-left
            v=min(l,1)*tone if l>0.5 else l*0.3
            g=int(max(0,min(1,v))*255)
            op[x,y]=(g,g,g,255)
    b=io.BytesIO(); o.save(b,'PNG',optimize=True)
    out[name]='data:image/png;base64,'+base64.b64encode(b.getvalue()).decode()
    print(name,len(out[name]),(x0,y0,x1,y1))
open('mascots.js','w').write('const MASCOT_SRC='+json.dumps(out)+';\n')
