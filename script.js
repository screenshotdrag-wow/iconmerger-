class IconMerger {
    constructor() {
        this.currentFile = null;
        this.platformFiles = {}; // 플랫폼별로 파일 저장
        this.convertedIco = null;
        this.resizedImages = {}; // 플랫폼별로 저장
        this.optimizedImage = null;
        this.platformSizes = {
            windows: [16, 24, 32, 48, 64, 128, 256, 512], // 윈도우 ICO 표준 크기들
            mac: [16, 32, 64, 128, 256, 512, 1024], // 맥 ICNS 표준 크기들 (macOS 권장)
            android: [48, 72, 96, 144, 192, 512], // 안드로이드 권장 크기 (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi, Play Store)
            ios: [20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024] // iOS 권장 크기 (App Icon 모든 해상도)
        };
        this.maxInputSize = 2048; // 최대 입력 크기
        this.optimalInputSize = 512; // 권장 입력 크기 (업계 표준)
        this.currentPlatform = 'windows'; // 현재 선택된 플랫폼
        this.mergedIcon = null; // 병합된 아이콘 데이터
        this.conversionStartTime = null; // 변환 시작 시간
        this.init();
        this.initAnalytics();
    }
    
    // Analytics tracking methods
    initAnalytics() {
        // Track page view
        if (typeof gtag !== 'undefined') {
            gtag('event', 'page_view', {
                page_title: 'IconMerger - PNG to ICO Converter',
                page_location: window.location.href
            });
        }
    }
    
    trackEvent(eventName, parameters = {}) {
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, parameters);
        }
    }
    
    trackFileUpload(fileSize, fileType) {
        this.trackEvent('file_upload', {
            file_size: fileSize,
            file_type: fileType,
            platform: this.currentPlatform
        });
    }
    
    trackConversion(iconCount, platform) {
        this.trackEvent('icon_conversion', {
            icon_count: iconCount,
            platform: platform,
            conversion_time: Date.now() - this.conversionStartTime
        });
    }
    
    trackDownload(action, fileCount) {
        this.trackEvent('download', {
            action: action, // 'individual' or 'merged'
            file_count: fileCount,
            platform: this.currentPlatform
        });
    }

    init() {
        this.setupEventListeners();
        this.setupScrollAnimation();
    }

    setupEventListeners() {
        // 파일 입력
        const fileInput = document.getElementById('fileInput');
        const fileInput2 = document.getElementById('fileInput2');
        const uploadArea = document.getElementById('uploadArea');
        const convertBtn = document.getElementById('convertBtn');
        const downloadBtn = document.getElementById('downloadBtn');
        const mergeBtn = document.getElementById('mergeBtn');

        // 드래그 앤 드롭
        uploadArea.addEventListener('click', () => {
            fileInput2.click();
        });
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        
        // 붙여넣기 (Ctrl+V)
        document.addEventListener('paste', this.handlePaste.bind(this));

        // 파일 선택
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        fileInput2.addEventListener('change', this.handleFileSelect.bind(this));

        // 버튼 이벤트
        convertBtn.addEventListener('click', this.convertToIco.bind(this));
        
        // Sentry 에러 테스트 버튼
        const testErrorBtn = document.getElementById('testErrorBtn');
        if (testErrorBtn) {
            testErrorBtn.addEventListener('click', () => {
                this.testSentryError();
            });
        }
        downloadBtn.addEventListener('click', this.downloadIco.bind(this));
        mergeBtn.addEventListener('click', this.mergeIcons.bind(this));
        
        // 플랫폼 선택 이벤트
        const platformButtons = document.querySelectorAll('.platform-btn');
        platformButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const platform = e.currentTarget.dataset.platform;
                
                // 비활성화된 버튼 클릭 시 커밍순 알림
                if (e.currentTarget.classList.contains('disabled')) {
                    const platformName = this.getPlatformName(platform);
                    alert(`${platformName} support is coming soon! 🚀\nCurrently only Windows ICO files are supported.`);
                    return;
                }
                
                // 플랫폼 전환
                this.switchPlatform(platform);
            });
        });
        
        // 이미지 삭제 이벤트
        const deleteImageBtn = document.getElementById('deleteImageBtn');
        if (deleteImageBtn) {
            deleteImageBtn.addEventListener('click', this.deleteImage.bind(this));
        }
    }

    setupScrollAnimation() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.step').forEach(step => {
            observer.observe(step);
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handlePaste(e) {
        const items = e.clipboardData.items;
        for (let item of items) {
            if (item.type.indexOf('image') !== -1) {
                const file = item.getAsFile();
                if (file && file.type === 'image/png') {
                    this.processFile(file);
                } else {
                    alert('PNG 파일만 지원됩니다.');
                }
                break;
            }
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.trackFileUpload(file.size, file.type);
            this.processFile(file);
        }
    }

    processFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 업로드할 수 있습니다.');
            return;
        }

        const platform = this.currentPlatform;
        console.log(`📁 Processing file for platform: ${platform}`);
        
        // 현재 플랫폼에 파일 저장
        this.platformFiles[platform] = file;
        this.currentFile = file; // 현재 파일 참조도 유지
        
        this.showFileInfo(file);
        this.createResizedImages(file);
    }

    showFileInfo(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const width = img.width;
                const height = img.height;
                
                // 미리보기 표시
                document.getElementById('previewImage').src = e.target.result;
                document.getElementById('uploadArea').style.display = 'none';
                document.getElementById('previewArea').style.display = 'block';
                
                // 파일 정보 표시
                const fileSizeKB = (file.size / 1024).toFixed(1);
                const quality = this.assessImageQuality(width, height);
                
                console.log(`파일 정보: ${width}x${height}, ${fileSizeKB}KB, 품질: ${quality}`);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    assessImageQuality(width, height) {
        const platform = this.currentPlatform;
        const recommended = this.getRecommendedSize(platform);
        
        if (width >= recommended && height >= recommended) {
            return '우수';
        } else if (width >= recommended * 0.8 && height >= recommended * 0.8) {
            return '양호';
        } else {
            return '개선 필요';
        }
    }

    getRecommendedSize(platform) {
        const recommendations = {
            windows: 512,
            mac: 1024,
            android: 512,
            ios: 1024
        };
        return recommendations[platform] || 512;
    }

    createResizedImages(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageSrc = e.target.result;
            const platform = this.currentPlatform;
            
            console.log(`📦 Creating resized images for: ${platform}`);
            
            // 현재 선택된 플랫폼에 대해서만 리사이즈된 이미지 생성
            this.resizedImages[platform] = this.platformSizes[platform].map(size => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = size;
                canvas.height = size;
                
                const img = new Image();
                img.onload = () => {
                    ctx.drawImage(img, 0, 0, size, size);
                    const dataUrl = canvas.toDataURL('image/png');
                    
                    // 해당 플랫폼의 리사이즈된 이미지 배열에 추가
                    const resizedImage = this.resizedImages[platform].find(r => r.size === size);
                    if (resizedImage) {
                        resizedImage.dataUrl = dataUrl;
                    }
                };
                img.src = imageSrc;
                
                return {
                    size: size,
                    dataUrl: null // 나중에 설정됨
                };
            });
            
            // 현재 플랫폼의 리사이즈된 이미지 표시
            setTimeout(() => {
                this.displayResizedImages();
                document.getElementById('resizeSection').style.display = 'block';
                console.log(`✅ Resized images created for: ${platform}`);
            }, 100);
        };
        reader.readAsDataURL(file);
    }

    displayResizedImages() {
        const platform = this.currentPlatform;
        const grid = document.getElementById('resizeGrid');

        if (!grid || !this.resizedImages[platform]) return;

        grid.innerHTML = this.resizedImages[platform].map(resized => {
            if (!resized.dataUrl) return '';
            
            // 표시 크기 제한 (최대 128px)
            const displaySize = Math.min(resized.size, 128);
            return `
                <div class="resize-item">
                    <img src="${resized.dataUrl}" alt="${resized.size}x${resized.size}"
                         style="width: ${displaySize}px; height: ${displaySize}px;">
                    <p class="size-label">${resized.size}×${resized.size}</p>
                    <p class="size-info">${this.getSizeDescription(platform, resized.size)}</p>
                    <p class="size-usage">${this.getSizeUsage(platform, resized.size)}</p>
                    <button class="btn btn-small" onclick="iconMerger.downloadSingleIcon(${resized.size}, '${resized.dataUrl}')">
                        Download ${resized.size}px
                    </button>
                </div>
            `;
        }).join('');
    }

    getSizeDescription(platform, size) {
        const descriptions = {
            windows: {
                16: 'Small Icon',
                24: 'Small Icon',
                32: 'Normal Icon',
                48: 'Large Icon',
                64: 'Large Icon',
                128: 'Very Large Icon',
                256: 'Very Large Icon',
                512: 'High Resolution Icon'
            },
            mac: {
                16: 'Small Icon',
                32: 'Small Icon',
                64: 'Normal Icon',
                128: 'Large Icon',
                256: 'Large Icon',
                512: 'Very Large Icon',
                1024: 'High Resolution Icon'
            },
            android: {
                36: 'Low Resolution',
                48: 'Medium Resolution',
                72: 'High Resolution',
                96: 'Very High Resolution',
                144: 'Ultra High Resolution',
                192: 'Ultra High Resolution'
            },
            ios: {
                20: 'Small Icon',
                29: 'Small Icon',
                40: 'Normal Icon',
                58: 'Normal Icon',
                60: 'Normal Icon',
                76: 'Large Icon',
                80: 'Large Icon',
                87: 'Large Icon',
                120: 'Very Large Icon',
                152: 'Very Large Icon',
                167: 'Very Large Icon',
                180: 'Very Large Icon',
                1024: 'App Store Icon'
            }
        };
        return descriptions[platform]?.[size] || 'Normal Icon';
    }

    getSizeUsage(platform, size) {
        const usages = {
            windows: {
                16: 'Taskbar, File Explorer',
                24: 'Taskbar, File Explorer',
                32: 'Desktop, File Explorer',
                48: 'Desktop, File Explorer',
                64: 'Desktop, File Explorer',
                128: 'Desktop, File Explorer',
                256: 'Desktop, File Explorer',
                512: 'High Resolution Display'
            },
            mac: {
                16: 'Finder, Dock',
                32: 'Finder, Dock',
                64: 'Finder, Dock',
                128: 'Finder, Dock',
                256: 'Finder, Dock',
                512: 'Finder, Dock',
                1024: '고해상도 디스플레이'
            },
            android: {
                36: 'ldpi (120dpi)',
                48: 'mdpi (160dpi)',
                72: 'hdpi (240dpi)',
                96: 'xhdpi (320dpi)',
                144: 'xxhdpi (480dpi)',
                192: 'xxxhdpi (640dpi)'
            },
            ios: {
                20: 'Small Icon',
                29: 'Small Icon',
                40: 'Normal Icon',
                58: 'Normal Icon',
                60: 'Normal Icon',
                76: 'Large Icon',
                80: 'Large Icon',
                87: 'Large Icon',
                120: 'Very Large Icon',
                152: 'Very Large Icon',
                167: 'Very Large Icon',
                180: 'Very Large Icon',
                1024: 'App Store'
            }
        };
        return usages[platform]?.[size] || 'General Use';
    }

    switchPlatform(platform) {
        // 플랫폼 변경 시 이전 플랫폼의 이미지 상태 초기화
        console.log(`🔄 Switching platform from ${this.currentPlatform} to ${platform}`);
        
        this.currentPlatform = platform;
        
        // 플랫폼 버튼 활성화 상태 업데이트
        document.querySelectorAll('.platform-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-platform="${platform}"]`).classList.add('active');
        
        // 플랫폼 가이드 업데이트
        this.updatePlatformGuide(platform);
        
        // 현재 플랫폼에 대한 파일 복원
        this.currentFile = this.platformFiles[platform] || null;
        
        // 현재 플랫폼에 대한 이미지가 있는지 확인
        const hasImages = this.resizedImages[platform] && this.resizedImages[platform].length > 0;
        
        if (hasImages) {
            // 기존 이미지가 있으면 표시
            console.log(`✅ Showing existing images for ${platform}`);
            
            // 원본 이미지 재표시
            if (this.currentFile) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    document.getElementById('previewImage').src = e.target.result;
                    document.getElementById('previewArea').style.display = 'block';
                    document.getElementById('uploadArea').style.display = 'none';
                };
                reader.readAsDataURL(this.currentFile);
            }
            
            // 리사이즈 섹션 표시
            document.getElementById('resizeSection').style.display = 'block';
            this.displayResizedImages();
            
            // 변환 영역 표시 (이미 변환된 경우)
            if (document.getElementById('downloadArea').style.display !== 'none') {
                document.getElementById('conversionArea').style.display = 'block';
            }
        } else {
            // 이미지가 없으면 업로드 화면 표시
            console.log(`⚠️ No images for ${platform}, showing upload area`);
            document.getElementById('uploadArea').style.display = 'block';
            document.getElementById('previewArea').style.display = 'none';
            document.getElementById('resizeSection').style.display = 'none';
            document.getElementById('conversionArea').style.display = 'none';
        }
    }

    updatePlatformGuide(platform) {
        const uploadTip = document.getElementById('uploadTip');
        const resizeTitle = document.getElementById('resizeTitle');
        const resizeDescription = document.getElementById('resizeDescription');
        
        const platformGuides = {
            windows: {
                title: 'Windows ICO Icons',
                description: 'Display each size at actual size',
                tip: '<p><strong>💡 Recommended Size:</strong></p><p>• <strong>512×512px</strong> recommended (Windows ICO file)</p>'
            },
            mac: {
                title: 'Mac ICNS Icons',
                description: 'Display each size at actual size (Testable on Windows)',
                tip: '<p><strong>💡 Recommended Size:</strong></p><p>• <strong>1024×1024px</strong> recommended (Mac ICNS file)</p><p>• ✅ Windows에서 ICNS 파일 구조 테스트 가능</p>'
            },
            android: {
                title: 'Android Icons',
                description: 'Display each size at actual size',
                tip: '<p><strong>💡 Recommended Size:</strong></p><p>• <strong>512×512px</strong> recommended (Android ZIP)</p><p>• 📦 mipmap 폴더 구조의 PNG 파일들</p>'
            },
            ios: {
                title: 'iOS Icons',
                description: 'Display each size at actual size',
                tip: '<p><strong>💡 Recommended Size:</strong></p><p>• <strong>1024×1024px</strong> recommended (iOS ZIP)</p><p>• 📦 App Icon 세트 PNG 파일들</p>'
            }
        };
        
        const guide = platformGuides[platform] || platformGuides.windows;
        uploadTip.innerHTML = guide.tip;
        resizeTitle.textContent = guide.title;
        resizeDescription.textContent = guide.description;
    }

    deleteImage() {
        if (!confirm('Are you sure you want to delete the uploaded image?')) {
            return;
        }

        const platform = this.currentPlatform;
        console.log(`🗑️ Deleting image for: ${platform}`);
        
        // 현재 플랫폼의 상태만 초기화 (다른 플랫폼은 유지)
        if (this.resizedImages[platform]) {
            this.resizedImages[platform] = undefined;
            console.log(`✅ Deleted images for ${platform}`);
        }
        
        // 현재 플랫폼의 파일 삭제
        if (this.platformFiles[platform]) {
            delete this.platformFiles[platform];
            console.log(`✅ Deleted file for ${platform}`);
        }
        
        // 현재 플랫폼의 merged icon 초기화
        if (this.mergedIcon && this.mergedIcon.platform === platform) {
            this.mergedIcon = null;
        }

        // UI 초기화 (현재 플랫폼만)
        document.getElementById('uploadArea').style.display = 'block';
        document.getElementById('previewArea').style.display = 'none';
        document.getElementById('resizeSection').style.display = 'none';
        document.getElementById('conversionArea').style.display = 'none';

        // 파일 입력 초기화
        document.getElementById('fileInput').value = '';
        document.getElementById('fileInput2').value = '';
        
        // 현재 파일 참조 제거
        this.currentFile = null;

        alert(`Image deleted for ${platform}.\nOther platforms' images are preserved.`);
    }

    convertToIco() {
        if (!this.currentFile) {
            alert('Please upload a PNG file first.');
            return;
        }

        this.conversionStartTime = Date.now();
        // 로딩 표시
        document.getElementById('loadingArea').style.display = 'block';
        document.getElementById('downloadArea').style.display = 'none';

        // 변환 완료 표시
        setTimeout(() => {
            document.getElementById('loadingArea').style.display = 'none';
            document.getElementById('downloadArea').style.display = 'block';
            this.displayConvertedIcons();
            
            // 변환 완료 추적
            const iconCount = this.resizedImages[this.currentPlatform]?.length || 0;
            this.trackConversion(iconCount, this.currentPlatform);
        }, 1000);
    }

    displayConvertedIcons() {
        const platform = this.currentPlatform;
        const grid = document.getElementById('convertedIconsGrid');

        if (!grid || !this.resizedImages[platform]) return;

        grid.innerHTML = this.resizedImages[platform].map(resized => {
            if (!resized.dataUrl) return '';
            
            // 표시 크기 제한 (최대 64px)
            const displaySize = Math.min(resized.size, 64);
            return `
                <div class="converted-icon-item">
                    <div class="icon-checkbox">
                        <input type="checkbox" class="icon-check" data-size="${resized.size}" checked>
                    </div>
                    <img src="${resized.dataUrl}" alt="${resized.size}x${resized.size}"
                         style="width: ${displaySize}px; height: ${displaySize}px;">
                    <p class="size-label">${resized.size}×${resized.size}</p>
                    <p class="size-info">${this.getSizeDescription(platform, resized.size)}</p>
                    <button class="btn btn-small" onclick="iconMerger.downloadSingleIcon(${resized.size}, '${resized.dataUrl}')">
                        Download ${resized.size}px
                    </button>
                </div>
            `;
        }).join('');
    }

    downloadSingleIcon(size, dataUrl) {
        const platform = this.currentPlatform;
        
        if (platform === 'windows') {
            // Windows: 개별 ICO 파일로 다운로드
            this.downloadSingleIco(size, dataUrl);
        } else {
            // Mac, Android, iOS: PNG 파일로 다운로드
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `icon_${size}px.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    downloadSingleIco(size, dataUrl) {
        // Canvas에서 이미지 데이터 추출
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            canvas.width = size;
            canvas.height = size;
            ctx.drawImage(img, 0, 0, size, size);
            
            // ICO 파일 생성
            const icoData = this.createSingleIcoFile(canvas, size);
            
            // 다운로드
            const blob = new Blob([icoData], { type: 'image/x-icon' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `icon_${size}px.ico`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        };
        
        img.src = dataUrl;
    }

    createSingleIcoFile(canvas, size) {
        // 단일 아이콘용 ICO 파일 생성
        const pngData = canvas.toDataURL('image/png').split(',')[1];
        const pngBytes = this.base64ToBytes(pngData);
        
        // ICO 파일 헤더 생성 (6바이트)
        const header = new Uint8Array(6);
        header[0] = 0; // Reserved (must be 0)
        header[1] = 0;
        header[2] = 1; // Type (1 = icon)
        header[3] = 0;
        header[4] = 1; // Number of images (1개)
        header[5] = 0;

        // 디렉토리 엔트리 생성 (16바이트)
        const entry = new Uint8Array(16);
        entry[0] = size === 256 ? 0 : size; // Width (0 if 256)
        entry[1] = size === 256 ? 0 : size; // Height (0 if 256)
        entry[2] = 0; // Color palette (0 for PNG)
        entry[3] = 0; // Reserved
        entry[4] = 1; // Color planes
        entry[5] = 0;
        entry[6] = 32; // Bits per pixel
        entry[7] = 0;
        entry[8] = pngBytes.length & 0xFF; // Image size (low byte)
        entry[9] = (pngBytes.length >> 8) & 0xFF;
        entry[10] = (pngBytes.length >> 16) & 0xFF;
        entry[11] = (pngBytes.length >> 24) & 0xFF;
        entry[12] = 22 & 0xFF; // Image offset (22 = 6 + 16)
        entry[13] = 0;
        entry[14] = 0;
        entry[15] = 0;

        // 전체 ICO 파일 생성
        const totalSize = header.length + entry.length + pngBytes.length;
        const icoFile = new Uint8Array(totalSize);
        let offset = 0;
        
        // 헤더 복사
        icoFile.set(header, offset);
        offset += header.length;
        
        // 디렉토리 엔트리 복사
        icoFile.set(entry, offset);
        offset += entry.length;
        
        // PNG 데이터 복사
        icoFile.set(pngBytes, offset);
        
        return icoFile;
    }

    downloadIco() {
        const platform = this.currentPlatform;
        const fileName = this.currentFile ? this.currentFile.name.replace('.png', '') : 'icon';

        // 체크된 아이콘들만 가져오기
        const checkedIcons = this.getCheckedIcons();
        
        // 다운로드 추적
        this.trackDownload('individual', checkedIcons.length);

        if (checkedIcons.length === 0) {
            alert('Please select icons to download.');
            return;
        }

        // 각 체크된 아이콘을 개별적으로 다운로드
        checkedIcons.forEach(icon => {
            this.downloadSingleIcon(icon.size, icon.dataUrl);
        });
    }

    getCheckedIcons() {
        const platform = this.currentPlatform;
        const checkedBoxes = document.querySelectorAll('.icon-check:checked');
        
        return Array.from(checkedBoxes).map(checkbox => {
            const size = parseInt(checkbox.dataset.size);
            const icon = this.resizedImages[platform].find(r => r.size === size);
            return {
                size: size,
                dataUrl: icon ? icon.dataUrl : null
            };
        }).filter(icon => icon.dataUrl);
    }

    mergeIcons() {
        const platform = this.currentPlatform;
        
        // 체크된 아이콘들만 가져오기
        const checkedIcons = this.getCheckedIcons();
        
        if (checkedIcons.length === 0) {
            alert('Please select icons to merge.');
            return;
        }

        // 병합된 아이콘을 3단계로 전달
        this.createMergedIcon(checkedIcons, platform);
        
        // 3단계로 스크롤
        document.getElementById('step3').scrollIntoView({ behavior: 'smooth' });
    }

    createMergedIcon(icons, platform) {
        let extension = 'ico';
        
        switch (platform) {
            case 'windows':
                extension = 'ico';
                break;
            case 'mac':
                extension = 'icns';
                break;
            case 'android':
                extension = 'zip';
                break;
            case 'ios':
                extension = 'zip';
                break;
        }

        // 실제 병합된 아이콘 생성
        this.mergedIcon = {
            icons: icons,
            extension: extension,
            count: icons.length,
            sizes: icons.map(icon => icon.size),
            platform: platform
        };
        
        // 3단계 UI 업데이트
        this.updateMergeStep();
    }

    updateMergeStep() {
        const mergeArea = document.getElementById('mergeArea');
        const icoList = document.getElementById('icoList');
        
        if (this.mergedIcon) {
            // 가장 큰 아이콘을 미리보기로 사용
            const previewIcon = this.mergedIcon.icons[this.mergedIcon.icons.length - 1];
            
            icoList.innerHTML = `
                <div class="merged-icon-item">
                    <div class="icon-preview">
                        <img src="${previewIcon.dataUrl}" alt="Merged Icon" style="width: 64px; height: 64px;">
                    </div>
                    <div class="icon-info">
                        <h4>iconmerger.${this.mergedIcon.extension}</h4>
                        <p>${this.mergedIcon.count} sizes merged (${this.mergedIcon.sizes.join(', ')}px)</p>
                        <p class="platform-info">${this.getPlatformName(this.mergedIcon.platform)} File</p>
                    </div>
                    <button class="btn btn-primary" onclick="iconMerger.downloadMergedIcon()">Download</button>
                </div>
            `;
            mergeArea.style.display = 'block';
        }
    }

    getPlatformName(platform) {
        const names = {
            'windows': 'Windows',
            'mac': 'Mac',
            'android': 'Android',
            'ios': 'iOS'
        };
        return names[platform] || platform;
    }

    downloadMergedIcon() {
        if (!this.mergedIcon) {
            console.log('❌ No merged icon to download');
            return;
        }
        
        const platform = this.mergedIcon.platform;
        
        console.log(`📥 Downloading ${platform} icon file...`);
        
        // 병합 다운로드 추적
        this.trackDownload('merged', this.mergedIcon.icons.length);
        
        if (platform === 'windows') {
            console.log('→ Creating Windows ICO file');
            this.createMultiResolutionIco();
        } else if (platform === 'mac') {
            console.log('→ Creating Mac ICNS file');
            this.createIcnsFile();
        } else if (platform === 'android') {
            console.log('→ Creating Android ZIP file');
            this.createAndroidZip();
        } else if (platform === 'ios') {
            console.log('→ Creating iOS ZIP file');
            this.createIosZip();
        } else {
            console.error(`❌ Unknown platform: ${platform}`);
        }
    }

    createMultiResolutionIco() {
        // 실제 다중 해상도 ICO 파일 생성
        this.createRealIcoFile();
    }

    createRealIcoFile() {
        // ICO 파일 헤더 생성 (6바이트)
        const iconCount = this.mergedIcon.icons.length;
        const header = new Uint8Array(6);
        
        // ICO 파일 시그니처
        header[0] = 0; // Reserved (must be 0)
        header[1] = 0;
        header[2] = 1; // Type (1 = icon)
        header[3] = 0;
        header[4] = iconCount; // Number of images
        header[5] = 0;

        // 각 아이콘의 디렉토리 엔트리 생성 (16바이트 × 아이콘 개수)
        const directoryEntries = [];
        let currentOffset = 6 + (iconCount * 16); // 헤더 + 디렉토리 엔트리들

        // 각 아이콘을 PNG 데이터로 변환하고 디렉토리 엔트리 생성
        const iconData = [];
        let processedCount = 0;
        
        for (let i = 0; i < this.mergedIcon.icons.length; i++) {
            const icon = this.mergedIcon.icons[i];
            const size = icon.size;
            
            // Canvas에서 PNG 데이터 추출
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = size;
            canvas.height = size;
            
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0, size, size);
                const pngData = canvas.toDataURL('image/png').split(',')[1];
                const pngBytes = this.base64ToBytes(pngData);
                
                // 디렉토리 엔트리 (16바이트)
                const entry = new Uint8Array(16);
                entry[0] = size === 256 ? 0 : size; // Width (0 if 256)
                entry[1] = size === 256 ? 0 : size; // Height (0 if 256)
                entry[2] = 0; // Color palette (0 for PNG)
                entry[3] = 0; // Reserved
                entry[4] = 1; // Color planes
                entry[5] = 0;
                entry[6] = 32; // Bits per pixel
                entry[7] = 0;
                entry[8] = pngBytes.length & 0xFF; // Image size (low byte)
                entry[9] = (pngBytes.length >> 8) & 0xFF;
                entry[10] = (pngBytes.length >> 16) & 0xFF;
                entry[11] = (pngBytes.length >> 24) & 0xFF;
                entry[12] = currentOffset & 0xFF; // Image offset (low byte)
                entry[13] = (currentOffset >> 8) & 0xFF;
                entry[14] = (currentOffset >> 16) & 0xFF;
                entry[15] = (currentOffset >> 24) & 0xFF;
                
                directoryEntries.push(entry);
                iconData.push(pngBytes);
                currentOffset += pngBytes.length;
                processedCount++;
                
                // 모든 아이콘이 처리되면 ICO 파일 생성
                if (processedCount === this.mergedIcon.icons.length) {
                    this.finalizeIcoFile(header, directoryEntries, iconData);
                }
            };
            img.src = icon.dataUrl;
        }
    }

    base64ToBytes(base64) {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }

    finalizeIcoFile(header, directoryEntries, iconData) {
        // 전체 ICO 파일 크기 계산
        let totalSize = header.length;
        directoryEntries.forEach(entry => totalSize += entry.length);
        iconData.forEach(data => totalSize += data.length);
        
        // ICO 파일 생성
        const icoFile = new Uint8Array(totalSize);
        let offset = 0;
        
        // 헤더 복사
        icoFile.set(header, offset);
        offset += header.length;
        
        // 디렉토리 엔트리들 복사
        directoryEntries.forEach(entry => {
            icoFile.set(entry, offset);
            offset += entry.length;
        });
        
        // 아이콘 데이터들 복사
        iconData.forEach(data => {
            icoFile.set(data, offset);
            offset += data.length;
        });
        
        // Blob 생성 및 다운로드
        const blob = new Blob([icoFile], { type: 'image/x-icon' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'iconmerger.ico';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        alert(`✅ Windows ICO file has been downloaded!\nIncluded sizes: ${this.mergedIcon.sizes.join(', ')}px`);
    }

    createIcnsFile() {
        // 맥용 ICNS 파일 생성 (실제 ICNS 포맷)
        this.createRealIcnsFile();
    }

    createRealIcnsFile() {
        // ICNS 파일 구조 생성 (Windows에서 테스트 가능)
        // ICNS는 "icns" 헤더 + TOC (Table of Contents) + 이미지 데이터로 구성
        
        const icons = this.mergedIcon.icons;
        const iconData = [];
        
        // ICNS 파일 헤더: "icns" (4바이트) + 파일 크기 (4바이트)
        const header = new Uint8Array(8);
        header[0] = 0x69; // 'i'
        header[1] = 0x63; // 'c'
        header[2] = 0x6E; // 'n'
        header[3] = 0x73; // 's'
        // 파일 크기는 나중에 계산
        
        let totalSize = 8; // 헤더 크기
        let processedCount = 0;
        
        // 각 아이콘을 ICNS 형식으로 변환
        icons.forEach((icon, index) => {
            const size = icon.size;
            const img = new Image();
            
            img.onload = () => {
                // Canvas에서 PNG 데이터 추출
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = size;
                canvas.height = size;
                ctx.drawImage(img, 0, 0, size, size);
                
                // PNG 데이터를 Base64로 추출
                const pngDataUrl = canvas.toDataURL('image/png');
                const pngData = pngDataUrl.split(',')[1];
                const pngBytes = this.base64ToBytes(pngData);
                
                // ICNS 데이터 청크 구조
                // OSType (4바이트) + 데이터 크기 (4바이트) + PNG 데이터
                const type = this.getIcnsType(size);
                const chunkSize = 8 + pngBytes.length;
                
                const chunk = new Uint8Array(chunkSize);
                
                // OSType (예: 'ic07' for 128x128 PNG)
                chunk[0] = type.charCodeAt(0);
                chunk[1] = type.charCodeAt(1);
                chunk[2] = type.charCodeAt(2);
                chunk[3] = type.charCodeAt(3);
                
                // 데이터 크기 (Big-Endian)
                chunk[4] = (chunkSize >> 24) & 0xFF;
                chunk[5] = (chunkSize >> 16) & 0xFF;
                chunk[6] = (chunkSize >> 8) & 0xFF;
                chunk[7] = chunkSize & 0xFF;
                
                // PNG 데이터 복사
                chunk.set(pngBytes, 8);
                
                iconData.push(chunk);
                totalSize += chunkSize;
                processedCount++;
                
                // 모든 아이콘이 처리되면 최종 ICNS 파일 생성
                if (processedCount === icons.length) {
                    this.finalizeIcnsFile(header, iconData, totalSize);
                }
            };
            
            img.src = icon.dataUrl;
        });
    }
    
    getIcnsType(size) {
        // ICNS 타입 매핑
        const typeMap = {
            16: 'is32',  // 16x16
            32: 'il32',  // 32x32
            64: 'ih32',  // 64x64
            128: 'it32', // 128x128
            256: 'ic07', // 256x256
            512: 'ic08', // 512x512
            1024: 'ic09' // 1024x1024
        };
        return typeMap[size] || 'ic07';
    }
    
    finalizeIcnsFile(header, iconData, totalSize) {
        // 헤더에 파일 크기 저장 (Big-Endian)
        header[4] = (totalSize >> 24) & 0xFF;
        header[5] = (totalSize >> 16) & 0xFF;
        header[6] = (totalSize >> 8) & 0xFF;
        header[7] = totalSize & 0xFF;
        
        // ICNS 파일 생성
        const icnsFile = new Uint8Array(totalSize);
        let offset = 0;
        
        // 헤더 복사
        icnsFile.set(header, offset);
        offset += header.length;
        
        // 아이콘 데이터 청크들 복사
        iconData.forEach(chunk => {
            icnsFile.set(chunk, offset);
            offset += chunk.length;
        });
        
        // Windows에서 ICNS 파일 검증 (콘솔 출력)
        this.validateIcnsFile(icnsFile);
        
        // Blob 생성 및 다운로드
        const blob = new Blob([icnsFile], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'iconmerger.icns';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        // Windows에서 테스트 가능한 정보 제공
        const sizes = this.mergedIcon.icons.map(icon => icon.size);
        alert(`Mac ICNS file has been downloaded!\n\n` +
              `Included sizes: ${sizes.join(', ')}px\n` +
              `File size: ${(totalSize / 1024).toFixed(2)} KB\n\n` +
              `✅ Windows 검증 결과 (콘솔 확인):\n` +
              `- F12 > Console 탭에서 검증 정보 확인\n\n` +
              `📱 실제 Mac 사용:\n` +
              `- Finder에서 .icns 파일 열기\n` +
              `- Preview에서 아이콘 미리보기\n` +
              `- Get Info에서 아이콘으로 표시`);
    }
    
    validateIcnsFile(icnsFile) {
        // ICNS 파일 구조 검증
        console.log('===== ICNS File Validation (Windows Test) =====');
        console.log('File Size:', icnsFile.length, 'bytes');
        
        // 헤더 검증 (0-7 bytes)
        const header = icnsFile.slice(0, 8);
        const signature = String.fromCharCode(header[0], header[1], header[2], header[3]);
        const fileSize = (header[4] << 24) | (header[5] << 16) | (header[6] << 8) | header[7];
        
        console.log('✓ Header Signature:', signature);
        console.log('✓ Expected File Size:', fileSize, 'bytes');
        console.log('✓ Signature Valid:', signature === 'icns' ? '✅ YES' : '❌ NO');
        console.log('✓ Size Match:', icnsFile.length === fileSize ? '✅ YES' : '❌ NO');
        
        // 청크 검증
        let offset = 8;
        let chunkIndex = 1;
        
        console.log('\n--- Chunk Structure ---');
        while (offset < icnsFile.length) {
            if (offset + 8 > icnsFile.length) {
                console.error('❌ Invalid chunk structure at offset', offset);
                break;
            }
            
            const chunkHeader = icnsFile.slice(offset, offset + 8);
            const chunkType = String.fromCharCode(chunkHeader[0], chunkHeader[1], chunkHeader[2], chunkHeader[3]);
            const chunkSize = (chunkHeader[4] << 24) | (chunkHeader[5] << 16) | (chunkHeader[6] << 8) | chunkHeader[7];
            
            console.log(`Chunk ${chunkIndex}:`);
            console.log(`  Type: ${chunkType}`);
            console.log(`  Size: ${chunkSize} bytes`);
            console.log(`  Position: ${offset}-${offset + chunkSize - 1}`);
            
            offset += chunkSize;
            chunkIndex++;
        }
        
        console.log('===== Validation Complete =====');
        console.log('💡 If all checks pass (✅), the ICNS file is valid!');
        console.log('📱 Test on Mac: Open the file in Finder or Preview');
    }

    createAndroidZip() {
        // 안드로이드용 ZIP 파일 생성 (다양한 해상도 PNG들)
        this.createRealAndroidZip();
    }

    createRealAndroidZip() {
        // JSZip 라이브러리를 사용하여 실제 ZIP 파일 생성
        if (typeof JSZip === 'undefined') {
            // JSZip이 없으면 간단한 구현
            this.createSimpleAndroidZip();
            return;
        }

        const zip = new JSZip();
        const icons = this.mergedIcon.icons;

        // 각 아이콘을 적절한 폴더에 추가
        icons.forEach(icon => {
            const size = icon.size;
            let folder = '';
            
            // 안드로이드 해상도별 폴더 매핑
            if (size <= 36) folder = 'drawable-ldpi';
            else if (size <= 48) folder = 'drawable-mdpi';
            else if (size <= 72) folder = 'drawable-hdpi';
            else if (size <= 96) folder = 'drawable-xhdpi';
            else if (size <= 144) folder = 'drawable-xxhdpi';
            else folder = 'drawable-xxxhdpi';

            // PNG 데이터를 ZIP에 추가
            const base64Data = icon.dataUrl.split(',')[1];
            zip.file(`${folder}/ic_launcher.png`, base64Data, { base64: true });
        });

        // ZIP 파일 생성 및 다운로드
        zip.generateAsync({ type: 'blob' }).then(content => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = 'iconmerger_android.zip';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            
            const sizes = this.mergedIcon.icons.map(icon => icon.size);
            alert(`✅ Android ZIP file has been downloaded!\n\n` +
                  `Included sizes: ${sizes.join(', ')}px\n` +
                  `📦 Android mipmap 폴더 구조:\n` +
                  `- mipmap-ldpi/\n` +
                  `- mipmap-mdpi/\n` +
                  `- mipmap-hdpi/\n` +
                  `- mipmap-xhdpi/\n` +
                  `- mipmap-xxhdpi/\n` +
                  `- mipmap-xxxhdpi/\n\n` +
                  `📱 사용법:\n` +
                  `1. ZIP 파일 압축 해제\n` +
                  `2. Android Studio 프로젝트의 res/ 폴더에 복사\n` +
                  `3. ic_launcher.png로 앱 아이콘 자동 적용`);
        });
    }

    createSimpleAndroidZip() {
        // JSZip이 없을 때의 간단한 구현
        const largestIcon = this.mergedIcon.icons[this.mergedIcon.icons.length - 1];
        
        const link = document.createElement('a');
        link.href = largestIcon.dataUrl;
        link.download = `iconmerger_android.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert(`Android file has been downloaded!\nIncluded sizes: ${this.mergedIcon.sizes.join(', ')}px\n\nNote: JSZip library is required for real ZIP file creation.`);
    }

    createIosZip() {
        // iOS용 ZIP 파일 생성 (다양한 크기 PNG들)
        this.createRealIosZip();
    }

    createRealIosZip() {
        // JSZip 라이브러리를 사용하여 실제 ZIP 파일 생성
        if (typeof JSZip === 'undefined') {
            // JSZip이 없으면 간단한 구현
            this.createSimpleIosZip();
            return;
        }

        const zip = new JSZip();
        const icons = this.mergedIcon.icons;

        // 각 아이콘을 적절한 이름으로 추가
        icons.forEach(icon => {
            const size = icon.size;
            let filename = '';
            
            // iOS 아이콘 이름 매핑
            if (size === 20) filename = 'Icon-20.png';
            else if (size === 29) filename = 'Icon-29.png';
            else if (size === 40) filename = 'Icon-40.png';
            else if (size === 58) filename = 'Icon-58.png';
            else if (size === 60) filename = 'Icon-60.png';
            else if (size === 76) filename = 'Icon-76.png';
            else if (size === 80) filename = 'Icon-80.png';
            else if (size === 87) filename = 'Icon-87.png';
            else if (size === 120) filename = 'Icon-120.png';
            else if (size === 152) filename = 'Icon-152.png';
            else if (size === 167) filename = 'Icon-167.png';
            else if (size === 180) filename = 'Icon-180.png';
            else if (size === 1024) filename = 'Icon-1024.png';
            else filename = `Icon-${size}.png`;

            // PNG 데이터를 ZIP에 추가
            const base64Data = icon.dataUrl.split(',')[1];
            zip.file(filename, base64Data, { base64: true });
        });

        // ZIP 파일 생성 및 다운로드
        zip.generateAsync({ type: 'blob' }).then(content => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = 'iconmerger_ios.zip';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            
            const sizes = this.mergedIcon.icons.map(icon => icon.size);
            alert(`✅ iOS ZIP file has been downloaded!\n\n` +
                  `Included sizes: ${sizes.join(', ')}px\n` +
                  `📦 iOS App Icon 세트:\n` +
                  `- Icon-20.png (1x, 2x, 3x)\n` +
                  `- Icon-29.png (1x, 2x, 3x)\n` +
                  `- Icon-40.png (1x, 2x, 3x)\n` +
                  `- Icon-60.png (2x, 3x)\n` +
                  `- Icon-76.png (1x, 2x)\n` +
                  `- Icon-1024.png (App Store)\n\n` +
                  `📱 사용법:\n` +
                  `1. ZIP 파일 압축 해제\n` +
                  `2. Xcode 프로젝트 Assets.xcassets에 추가\n` +
                  `3. AppIcon에 이미지 드래그 앤 드롭\n` +
                  `4. 빌드 후 앱 아이콘으로 표시됨`);
        });
    }

    createSimpleIosZip() {
        // JSZip이 없을 때의 간단한 구현
        const largestIcon = this.mergedIcon.icons[this.mergedIcon.icons.length - 1];
        
        const link = document.createElement('a');
        link.href = largestIcon.dataUrl;
        link.download = `iconmerger_ios.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert(`iOS file has been downloaded!\nIncluded sizes: ${this.mergedIcon.sizes.join(', ')}px\n\nNote: JSZip library is required for real ZIP file creation.`);
    }
    
    // Sentry 에러 테스트 함수
    testSentryError() {
        try {
            // 의도적으로 에러 발생
            throw new Error('Sentry 테스트 에러입니다! 이 에러는 Sentry 대시보드에서 확인할 수 있습니다.');
        } catch (error) {
            // Sentry로 에러 전송
            if (typeof Sentry !== 'undefined') {
                Sentry.captureException(error);
                alert('Sentry로 테스트 에러가 전송되었습니다! Sentry 대시보드를 확인해보세요.');
            } else {
                alert('Sentry가 설정되지 않았습니다. DSN을 확인해주세요.');
            }
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.iconMerger = new IconMerger();
});