import cv2, sys, numpy as np
src, out = sys.argv[1], sys.argv[2]  # python sheet.py video.mp4 sheet.jpg
c = cv2.VideoCapture(src)
n = int(c.get(cv2.CAP_PROP_FRAME_COUNT)); fps = c.get(cv2.CAP_PROP_FPS)
w = int(c.get(3)); h = int(c.get(4))
print(src, w, h, fps, n, n/fps)
idx = [int(i*(n-1)/11) for i in range(12)]
tiles=[]
for i in idx:
    c.set(cv2.CAP_PROP_POS_FRAMES, i); ok, f = c.read()
    if not ok: f = np.zeros((h,w,3),np.uint8)
    f = cv2.resize(f, (270, int(270*h/w)))
    cv2.putText(f, f"{i} {i/fps:.1f}s", (8,24), cv2.FONT_HERSHEY_SIMPLEX, .7, (0,255,255), 2)
    tiles.append(f)
rows=[np.hstack(tiles[r*6:(r+1)*6]) for r in range(2)]
cv2.imwrite(out, np.vstack(rows))
