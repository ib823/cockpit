# YTL Cement PowerPoint Formats - Comparison

## Generated Files

### 1. **YTL_Cement_Native_PPT.pptx** ⭐ RECOMMENDED
- **Size:** 38 KB
- **Format:** Native PowerPoint shapes, text boxes, and connectors
- **Fully Editable:** ✅ Yes - every element can be edited
- **Slides:** 5 key diagrams

#### Advantages:
✅ **Fully editable** - Click any box to change text, colors, size, position
✅ **Tiny file size** - 38KB vs 1.1MB (97% smaller!)
✅ **Professional quality** - Native PowerPoint rendering
✅ **Easy customization** - Drag and drop, resize, recolor
✅ **No image quality loss** - Vector-based shapes
✅ **Works offline** - No external dependencies

#### What's Editable:
- All text content (click to edit)
- All colors (fill and border)
- All positions (drag to move)
- All sizes (drag corners to resize)
- Font styles, sizes, bold/italic
- Add/remove shapes easily

#### Included Slides:
1. **Title Slide** - YTL Cement SAP S/4HANA Transformation
2. **Capability Map AS-IS** - Current state with RED indicators
3. **Capability Map TO-BE** - Target state with GREEN indicators
4. **Gap Analysis** - 5 major gaps with AS-IS → Solution → TO-BE flow
5. **ROI Summary** - Investment breakdown and annual benefits

---

### 2. **YTL_Cement_Presentation.pptx**
- **Size:** 1.1 MB
- **Format:** Embedded PNG images
- **Fully Editable:** ❌ No - images only, can't edit content
- **Slides:** 11 slides (all diagrams)

#### Use When:
- You need all 10 diagrams quickly
- You don't need to edit diagram content
- You want reference diagrams for other slides

---

## Recommendation

### For Presentations: Use **YTL_Cement_Native_PPT.pptx**

**Why?**
1. Fully customizable for different audiences
2. Easy to update numbers, costs, timelines
3. Recolor for different themes
4. Add/remove sections as needed
5. Professional native PowerPoint look
6. Tiny file size (easy to email)

### To Extend the Native PPT

The Python script (`create_native_ppt.py`) can be easily modified to add more diagrams:

```python
# Example: Add a new slide with custom boxes
slide = prs.slides.add_slide(prs.slide_layouts[6])

# Add colored boxes
box1 = add_shape_box(
    slide,
    Inches(1), Inches(2), Inches(3), Inches(1),  # position and size
    "Your Text Here",  # text
    (255, 200, 200),  # RGB color (light red)
    text_size=12,
    bold=True
)
```

### Editing in PowerPoint

1. **Change Text:** Click any shape → Edit text directly
2. **Change Color:** Right-click shape → Format Shape → Fill
3. **Move:** Click and drag
4. **Resize:** Click shape → Drag corner handles
5. **Copy/Paste:** Standard Ctrl+C / Ctrl+V
6. **Add Connectors:** Insert → Shapes → Connectors

---

## File Locations

All files are in `/workspaces/cockpit/`:

- `YTL_Cement_Native_PPT.pptx` - **Native editable version** ⭐
- `YTL_Cement_Presentation.pptx` - Image-based version
- `create_native_ppt.py` - Python script to generate/modify
- `YTL_*.png` - Individual diagram images (10 files)
- `YTL_*.svg` - Vector format images (10 files)
- `YTL_*.puml` - Source PlantUML files (10 files)

---

## Next Steps

1. **Download** `YTL_Cement_Native_PPT.pptx`
2. **Open** in PowerPoint/Google Slides/LibreOffice
3. **Edit** any text, colors, or layout
4. **Customize** for your specific audience
5. **Add** additional slides from `YTL_Cement_Presentation.pptx` if needed

---

## Technical Details

### Native PPT Built With:
- Python library: `python-pptx`
- Elements: Rounded rectangles, text boxes, shapes
- Colors: RGB values matching PlantUML theme
- Fonts: Arial (standard, universally supported)
- Layout: 16:9 widescreen format

### Color Scheme:
- **RED (255, 107, 107)**: Manual/Error-prone processes
- **GREEN (102, 187, 106)**: Automated/Optimized processes
- **YELLOW (255, 255, 153)**: Solutions/Transition state
- **BLUE (66, 165, 245)**: MVP Modules
- **GRAY (176, 176, 176)**: Partially implemented

All colors are easily changeable in PowerPoint!
