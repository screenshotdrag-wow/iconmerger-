# IconMerger

A modern web application for converting PNG images to ICO files with multi-resolution support.

## Features

- **PNG to ICO Conversion**: Convert PNG images to Windows ICO format
- **Multi-Resolution Support**: Generate ICO files with multiple icon sizes (16px to 512px)
- **Drag & Drop Upload**: Easy file upload with drag and drop support
- **Paste Support**: Upload images directly from clipboard (Ctrl+V)
- **Real-time Preview**: See resized icons at their actual size
- **Selective Download**: Choose which icon sizes to download
- **Merge Functionality**: Combine multiple icon sizes into a single ICO file
- **Platform Support**: Currently supports Windows (Mac, Android, iOS coming soon)

## How to Use

1. **Upload PNG**: Drag and drop or click to upload a PNG image (512×512px recommended)
2. **Convert Icons**: Click "Convert All Icons" to generate multiple icon sizes
3. **Select & Download**: Choose which sizes to download individually or merge into one ICO file

## Supported Icon Sizes

- 16×16px - Small Icon (Taskbar, File Explorer)
- 24×24px - Small Icon (Taskbar, File Explorer)
- 32×32px - Normal Icon (Desktop, File Explorer)
- 48×48px - Large Icon (Desktop, File Explorer)
- 64×64px - Large Icon (Desktop, File Explorer)
- 128×128px - Very Large Icon (Desktop, File Explorer)
- 256×256px - Very Large Icon (Desktop, File Explorer)
- 512×512px - High Resolution Icon (High Resolution Display)

## Technical Details

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Image Processing**: Canvas API for resizing and format conversion
- **ICO Generation**: Custom ICO file format implementation
- **File Handling**: Blob API for file downloads
- **Responsive Design**: Mobile-friendly interface

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

© 2025 IconMerger. All rights reserved.

## Contact

For questions or support, please contact: contact@iconmerger.com

## Roadmap

- [ ] Mac ICNS file support
- [ ] Android APK icon generation
- [ ] iOS app icon generation
- [ ] Batch processing
- [ ] Advanced image optimization
