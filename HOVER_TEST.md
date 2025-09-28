# 🎯 Hover Detection Test Guide

## ✅ Quick Test Steps

1. **Start your React app:**
   ```bash
   npm start
   ```

2. **Open** `http://localhost:3000`

3. **Look for these elements:**
   - Video player with your `game-video.mp4`
   - Status bar showing "🎭 Demo Mode • 3 demo players • Hover to test"
   - Subtle pulsing green boxes around player areas

4. **Test hover detection:**
   - **Hover around 15% from left, 25% from top** → Should see Tom Brady (#12)
   - **Hover around 35% from left, 20% from top** → Should see Mike Evans (#13)  
   - **Hover around 25% from left, 30% from top** → Should see Rob Gronkowski (#87)

## 🔍 What Should Happen on Hover:

✅ **Green bounding box** appears around the player area  
✅ **Jersey number and name** shown on top of the box  
✅ **Tooltip** appears in top-right with player details  
✅ **Smooth animation** and glow effects  

## 🐛 If Nothing Happens:

### Check 1: Are the demo boxes visible?
- You should see faint pulsing green rectangles on the video
- If not, check browser console for errors

### Check 2: Is the video loaded?
- Make sure `game-video.mp4` is in your `public/` folder
- Video should be playing or at least loaded

### Check 3: Mouse position
- Try moving your mouse slowly around the areas mentioned above
- The hover zones are 8% wide by 12% tall

### Check 4: Browser compatibility
- Try in Chrome/Firefox if using Safari
- Check if JavaScript is enabled

## 🤖 AI Detection Test:

1. **Make sure backend is running:**
   ```bash
   cd ai_backend
   python3 simple_app.py
   ```

2. **Click "START AI DETECTION"** button

3. **Play the video** and wait for real AI detection

4. **Green boxes should appear** around actual players in the video

## 📊 Debug Info:

Open browser console (F12) and look for:
- Mouse position logs
- Hover detection events  
- Any error messages

## 💡 Expected Behavior:

**Demo Mode (Default):**
- 3 predefined player areas with hover detection
- Immediate response when hovering
- Shows hardcoded player info

**AI Mode (After clicking "START AI DETECTION"):**
- Real-time player detection from video frames
- Dynamic bounding boxes based on actual players
- Jersey number recognition via OCR

---

**If hover detection works in Demo Mode, your system is ready! 🎉**
