# 📊 IconMerger Analytics & Ad Setup Guide

## 🔧 **설정해야 할 ID들**

### **1. Google Analytics 4 (GA4)**
1. [Google Analytics](https://analytics.google.com/) 접속
2. 새 속성 생성 → "IconMerger" 
3. **측정 ID** 복사 (예: `G-XXXXXXXXXX`)
4. `index.html`에서 `GA_MEASUREMENT_ID`를 실제 ID로 교체

### **2. Google Tag Manager (GTM)**
1. [Google Tag Manager](https://tagmanager.google.com/) 접속
2. 새 컨테이너 생성 → "IconMerger"
3. **컨테이너 ID** 복사 (예: `GTM-XXXXXXX`)
4. `index.html`에서 `GTM-XXXXXXX`를 실제 ID로 교체

### **3. Google AdSense**
1. [Google AdSense](https://www.google.com/adsense/) 접속
2. 사이트 추가 → `iconmerger.com`
3. **게시자 ID** 복사 (예: `ca-pub-XXXXXXXXXXXXXXXX`)
4. **광고 슬롯 ID** 복사 (예: `XXXXXXXXXX`)
5. `index.html`에서 해당 ID들로 교체

## 📈 **추적되는 이벤트들**

### **자동 추적:**
- **페이지 뷰**: 사이트 방문
- **파일 업로드**: 파일 크기, 타입, 플랫폼
- **아이콘 변환**: 변환된 아이콘 수, 플랫폼, 소요 시간
- **다운로드**: 개별/병합 다운로드, 파일 수, 플랫폼

### **커스텀 이벤트 추가:**
```javascript
// 예시: 버튼 클릭 추적
iconMerger.trackEvent('button_click', {
    button_name: 'convert_icons',
    platform: 'windows'
});
```

## 💰 **광고 최적화 팁**

### **광고 배치:**
- **현재**: 3단계 후 배너 광고
- **추가 가능**: 사이드바, 헤더, 푸터

### **수익 최적화:**
- **고품질 트래픽**: SEO 최적화
- **사용자 경험**: 광고 로딩 속도 최적화
- **A/B 테스트**: 광고 위치 및 크기 테스트

## 🚀 **배포 후 확인사항**

1. **Google Analytics**: 실시간 보고서에서 데이터 확인
2. **AdSense**: 광고 승인 상태 확인
3. **GTM**: 태그 실행 상태 확인
4. **콘솔 에러**: 개발자 도구에서 오류 확인

## 📱 **모바일 최적화**

- **반응형 광고**: `data-full-width-responsive="true"`
- **터치 친화적**: 광고 크기 및 간격 조정
- **로딩 속도**: 광고 스크립트 비동기 로딩

## 🔒 **개인정보 보호**

- **GDPR 준수**: 쿠키 동의 배너 추가 고려
- **개인정보 처리방침**: 웹사이트에 추가
- **데이터 보관**: Google Analytics 데이터 보관 정책 설정

---

**💡 팁**: 모든 ID를 실제 값으로 교체한 후 Vercel에 배포하세요!
