import cv2, sys, numpy as np
# python card.py video.mp4  → кадр бүрийн картын (x-min,x-max) (y-min,y-max), 1080x1920 видеонд тааруулсан
c = cv2.VideoCapture(sys.argv[1])
i=0
while True:
    ok,f=c.read()
    if not ok: break
    if i>=60 and (i%6==0 or i>=150):
        hsv=cv2.cvtColor(f,cv2.COLOR_BGR2HSV)
        # card: bright, low saturation; restrict to the lower-centre where no gloves are
        m=((hsv[...,2]>170)&(hsv[...,1]<60)).astype(np.uint8)
        # column profile on rows 1100-1500 (below hands), row profile on cols 450-630
        cols=m[1100:1500].mean(0); rows=m[:,450:630].mean(1)
        xs=np.where(cols>.8)[0]; ys=np.where(rows>.8)[0]
        print(i, (xs.min(),xs.max()) if len(xs) else None, (ys.min(),ys.max()) if len(ys) else None)
    i+=1
