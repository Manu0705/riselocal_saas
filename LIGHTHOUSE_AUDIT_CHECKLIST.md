# 🚀 Lighthouse Performance Audit Checklist

**Target:** Validate that all 5 performance priority fixes deliver expected load time improvements.  
**Baseline:** Paid Render ($7) with optimizations applied.  
**Expected Result:** Public pages load in **0.6-0.8 seconds** (vs prior 1-2 seconds).

---

## 📋 PRE-AUDIT SETUP

### **Prerequisites**
- [ ] Code changes deployed to **staging** (Vercel) or **production** (Render $7)
- [ ] API running on paid Render instance (always-on, no cold start)
- [ ] Vercel deployment complete (web app live)
- [ ] All tenant configuration loaded (at least 1 test tenant with images/gallery)

### **Tools Required**
```bash
# Chrome DevTools (built-in, no install needed)
# OR: Install Lighthouse CLI
npm install -g @lhci/cli@0.11.0
```

---

## 🎯 AUDIT PROTOCOL

### **Test Environment**
| Setting | Value |
|---------|-------|
| Browser | Chrome (latest) |
| Location | Desktop + Mobile |
| Network | Throttle to 4G (125 Mbps down, 25 Mbps up) |
| CPU | 4x slowdown (realistic mobile hardware) |
| Cache | Clear before each run |
| Test URL | Public tenant page (e.g., `https://your-tenant.riselocal.in`) |

---

## ✅ STEP 1: BASELINE MEASUREMENT (Before Deploy)

### **1a. Desktop Baseline** 
**Test URL:** `https://your-tenant.riselocal.in` (Empty cache)

1. Open Chrome DevTools (`F12`)
2. Go to **Lighthouse** tab
3. Configure:
   - Device: **Desktop**
   - Throttling: **Simulated Fast 3G** (or No throttling for first run)
   - Clear storage: **checked**
4. Click **Analyze page load**
5. Wait 2-3 minutes for audit to complete
6. **Take screenshot** of report and document metrics below:

| Baseline Metric | Desktop Value | Notes |
|------------------|---------------|-------|
| **Performance Score** | ___ / 100 | Target: >90 |
| **Largest Contentful Paint (LCP)** | ___ms | Target: <1.2s |
| **First Input Delay (FID)** | ___ms | Target: <100ms |
| **Cumulative Layout Shift (CLS)** | ___.__ | Target: <0.1 |
| **First Contentful Paint (FCP)** | ___ms | Target: <1.8s |
| **Time to Interactive (TTI)** | ___ms | Target: <3.8s |
| **Speed Index** | ___ms | Target: <4.3s |
| **Total Blocking Time (TBT)** | ___ms | Target: <200ms |

### **1b. Mobile Baseline**
**Test URL:** Same as above

1. In Lighthouse settings, change Device to **Mobile**
2. Enable throttling: **Simulated 4G** (125/25 Mbps)
3. Re-run audit
4. Document metrics:

| Baseline Metric | Mobile Value | Notes |
|-----------------|--------------|-------|
| **Performance Score** | ___ / 100 | Target: >85 |
| **LCP (Largest Contentful Paint)** | ___ms | Target: <2.5s |
| **FID (First Input Delay)** | ___ms | Target: <100ms |
| **CLS (Cumulative Layout Shift)** | ___.__ | Target: <0.1 |
| **FCP** | ___ms | Target: <3.0s |
| **TTI** | ___ms | Target: <5.3s |
| **Speed Index** | ___ms | Target: <5.8s |
| **TBT (Total Blocking Time)** | ___ms | Target: <200ms |

### **1c. DevTools Network Tab Analysis**

1. Clear cache (`Ctrl+Shift+Delete`)
2. Open **DevTools > Network** tab
3. Reload page with **4G throttling enabled** (`DevTools > More tools > Network conditions`)
4. Document:

| Network Metric | Value | Notes |
|---|---|---|
| **Total requests** | ___ | Lower = better |
| **Total size (all)** | ___MB | |
| **Image size** | ___MB | <1MB ideal |
| **JS size** | ___MB | |
| **CSS size** | ___KB | |
| **API call count** | ___ | 1-2 ideal |
| **Slowest request** | ___ms | Identify bottleneck |
| **Page fully loaded** | ___ms | Time to DOMContentLoaded |

---

## 🚀 STEP 2: DEPLOY & VALIDATE CHANGES

### **2a. Git Commit & Deploy**
```bash
cd /path/to/saas_existing

# Verify changes are ready
git status

# Commit performance fixes
git add -A
git commit -m "perf: all 5 priority optimizations

- Priority 1: Migration to next/image component
- Priority 2: API pagination (gallery images limited to 20)
- Priority 3: System font stack (removed Manrope web font)
- Priority 4: Cloudinary URL transforms (f_auto, q_auto:best)
- Priority 5: Cache-Control headers (5min browser, 10min CDN)

Expected impact: -380-560ms (40-60% faster)"

# Push to trigger auto-deploy
git push origin main
```

### **2b. Verify Deployment**
**For Render API:**
```bash
# Check API health endpoint (should be instant)
curl -I https://api.riselocal.in/health

# Expected header:
# HTTP/1.1 200 OK
# Cache-Control: public, max-age=300
```

**For Vercel Web:**
1. Open Vercel dashboard
2. Navigate to your project
3. Check deployment status = **Ready**
4. Test public page loads

### **2c. Wait for CDN Cache Invalidation**
- **Vercel:** ~5-10 minutes (auto-purges old assets)
- **Render API:** Already live, cache starts at next request

---

## ✅ STEP 3: POST-OPTIMIZATION AUDIT

### **3a. Desktop Post-Audit**
1. **Clear ALL cache:**
   - DevTools > Application tab > Clear storage > Clear site data
   - OR: Hard refresh (`Ctrl+Shift+R`)
2. **Run Lighthouse again** (same settings as baseline)
3. Document **all metrics** from Step 1a and compare side-by-side

| Metric | Baseline | Post-Opt | Improvement | Pass? |
|--------|----------|----------|-------------|-------|
| **Performance Score** | ___/100 | ___/100 | +___ pts | ✓/✗ |
| **LCP** | ___ms | ___ms | -___ms | ✓/✗ |
| **FCP** | ___ms | ___ms | -___ms | ✓/✗ |
| **TTI** | ___ms | ___ms | -___ms | ✓/✗ |
| **Speed Index** | ___ms | ___ms | -___ms | ✓/✗ |
| **TBT** | ___ms | ___ms | -___ms | ✓/✗ |

**Target: All improvements ≥ 30% or ≥100ms reduction**

### **3b. Mobile Post-Audit**
1. Clear cache (see 3a)
2. Run Lighthouse with **Mobile + 4G throttling**
3. Document metrics and compare to baseline

| Metric | Baseline | Post-Opt | Improvement | Pass? |
|--------|----------|----------|-------------|-------|
| **Performance Score** | ___/100 | ___/100 | +___ pts | ✓/✗ |
| **LCP** | ___ms | ___ms | -___ms | ✓/✗ |
| **FCP** | ___ms | ___ms | -___ms | ✓/✗ |
| **TTI** | ___ms | ___ms | -___ms | ✓/✗ |
| **Speed Index** | ___ms | ___ms | -___ms | ✓/✗ |
| **TBT** | ___ms | ___ms | -___ms | ✓/✗ |

**Target: Mobile improvements ≥ 40% or ≥150ms reduction**

### **3c. Network Tab Post-Audit**

1. Clear cache
2. Open **DevTools > Network**
3. Apply **4G throttle** and reload
4. Compare metrics to Step 1c:

| Network Metric | Baseline | Post-Opt | Expected | Status |
|---|---|---|---|---|
| **Total requests** | ___ | ___ | -20% | ✓/✗ |
| **Image size** | ___MB | ___MB | -50% | ✓/✗ |
| **API call size** | ___KB | ___KB | -60% (pagination) | ✓/✗ |
| **Slowest request** | ___ms | ___ms | -30% | ✓/✗ |
| **Page load time** | ___ms | ___ms | -50% | ✓/✗ |

---

## 🔍 STEP 4: DETAILED CHECKS BY PRIORITY

### **Priority 1 Validation: Next.js Image**

**4a. Image Format Detection**
1. Open **DevTools > Network > Img** (filter by images)
2. For each image, check **Response Headers:**
   - **Modern browser (Chrome):** Should see `.webp` or `.avif` in Content-Type
   - **Fallback:** Should be `.jpg` or `.png`
3. Document sample:

```
Gallery Image 1:
  ✓ Modern browser: webp (182KB)
  ✓ Slow connection: jpg (456KB) [fallback]
  ✓ LCP improvement: ~40%

Hero Banner:
  ✓ priority=true set? (no lazy load)
  ✓ Format: avif or webp
  ✓ Size optimized: <300KB
```

**4b. Lighthouse Opportunities Report**
1. In Lighthouse report, scroll to **Opportunities** section
2. Expected findings AFTER optimization:
   - ✓ "Serve images in next-gen formats" → Passing (or minor remaining)
   - ✓ "Properly size images" → Passing
   - ✓ "Offscreen images" → Passing (lazy loaded)
3. Document any remaining opportunities:

| Opportunity | Before | After | Status |
|---|---|---|---|
| Next-gen formats | ⚠️ Large savings | ✓ Passing | Fixed |
| Properly sized | ⚠️ Large savings | ✓ Passing | Fixed |
| Offscreen images | ⚠️ Large savings | ✓ Passing | Fixed |

---

### **Priority 2 Validation: API Pagination**

**4c. API Response Size**
1. In **DevTools > Network > XHR/Fetch**, find `/tenants/slug`
2. Click request, go to **Response** tab
3. Measure payload size:

```
Before optimization:  ~2.5MB (all 100+ gallery images)
After optimization:   ~400KB (first 20 images only)
Expected savings:     ~85-90%
```

4. Document:
```
API /tenants/slug request:
  ✓ Size before: ___MB
  ✓ Size after: ___KB
  ✓ Reduction: __% (target >80%)
  ✓ Cache-Control header: public, max-age=300 ✓/✗
```

**4d. Gallery Load Performance**
1. In Lightouse report, check:
   - "Reduce unused JavaScript" → Should improve
   - "Reduce unused CSS" → Check for gallery-specific bloat
2. Expected: **-50-100ms** from smaller API payload

---

### **Priority 3 Validation: Font Stack**

**4e. Font Loading**
1. **DevTools > Network > Font** (filter)
2. Should see **0 font files** (no external fonts loading)
3. System fonts (`-apple-system`, `Segoe UI`) are instant

```
Font Network Requests:
  Before: 1-2 font files loaded (150-300ms)
  After: 0 external fonts (instant system fonts) ✓

FCP Impact:
  Expected improvement: -50ms (no font download blocking)
```

**4f. Lighthouse Checks**
1. Go to **Opportunities > Preload Fonts** (should not appear)
2. Performance score should have no font-related deductions

---

### **Priority 4 Validation: Cloudinary Transforms**

**4g. Image URL Inspection**
1. In **DevTools > Network > Img**, inspect image URLs
2. Sample URLs should look like:

```
✓ https://res.cloudinary.com/riselocal/.../f_auto,q_auto:best,c_limit/image.jpg
✗ https://res.cloudinary.com/riselocal/.../image.jpg (old format)
```

3. Check all image requests:

```
Gallery Images with transforms:
  ✓ Image 1: f_auto,q_auto:best applied? YES/NO
  ✓ Image 2: f_auto,q_auto:best applied? YES/NO
  ✓ Image 3: f_auto,q_auto:best applied? YES/NO

Expected bandwidth savings: 10-20% per image
```

**4h. Lighthouse Checks**
1. Expected: **Opportunities** section should show no WebP/AVIF warnings
2. Look for:
   - ✓ "Serve images in next-gen formats" → All passing
   - ✓ No bandwidth waste on unoptimized images

---

### **Priority 5 Validation: Cache Headers**

**4i. Cache Headers Check**
1. In **DevTools > Network**, find `/tenants/slug` API request
2. Click response, go to **Headers** tab
3. Look for **Response Headers:**

```
✓ Cache-Control: public, max-age=300, s-maxage=600
  (or similar)

If NOT present:
  ✗ FAIL: Cache headers not applied
```

4. Test **Cache Behavior:**
   - Load page 1st time (cache empty): ~600ms
   - Load page 2nd time (within 5min): should be ~100-150ms faster (API cached)
   - After 5min: Cache expires, next load ~600ms again

| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| 1st load (empty) | ~600ms | ___ms | ✓/✗ |
| 2nd load (cached) | ~300ms | ___ms | ✓/✗ |
| Network tab shows cached | YES | YES/NO | ✓/✗ |

---

## 📊 STEP 5: SUMMARY & VALIDATION

### **5a. Overall Performance Summary**

| Category | Baseline | Post-Opt | Target | Status |
|----------|----------|----------|--------|--------|
| **Desktop Performance Score** | ___/100 | ___/100 | >90 | ✓/✗ |
| **Mobile Performance Score** | ___/100 | ___/100 | >85 | ✓/✗ |
| **LCP (Desktop)** | ___ms | ___ms | <1.2s | ✓/✗ |
| **LCP (Mobile)** | ___ms | ___ms | <2.5s | ✓/✗ |
| **Total Page Load** | ___ms | ___ms | <800ms | ✓/✗ |
| **API Response** | ___ms | ___ms | <150ms | ✓/✗ |
| **Image Total Size** | ___MB | ___MB | <1MB | ✓/✗ |

### **5b. Priority Validation Checklist**

- [ ] **Priority 1 (Images):** Next.js Image component active, WebP/AVIF served, lazy loading working
- [ ] **Priority 2 (Pagination):** API response <500KB, first 20 gallery images loaded
- [ ] **Priority 3 (Fonts):** System fonts used, no external font downloads
- [ ] **Priority 4 (Cloudinary):** f_auto, q_auto:best present in image URLs
- [ ] **Priority 5 (Cache):** Cache-Control headers present, 2nd visit faster by >100ms

### **5c. Pass/Fail Criteria**

**✅ PASS (Green):**
- Desktop Performance Score ≥ 90
- Mobile Performance Score ≥ 85
- LCP improved by ≥ 100ms (or now <1.2s)
- All 5 priorities validated
- No error in console

**⚠️ PARTIAL (Yellow):**
- Performance score 85-90 (good but not excellent)
- LCP improved by 50-100ms
- 4 of 5 priorities validated

**❌ FAIL (Red):**
- Performance score < 85
- LCP unchanged or worse
- Missing priority implementations
- JavaScript errors in console

---

## 🔧 STEP 6: TROUBLESHOOTING

### **Issue: Performance didn't improve**

**Possible Causes:**
1. **Cache not cleared** → Full hard refresh: `Ctrl+Shift+Delete` then reload
2. **Old code still running** → Check Vercel/Render deployment status
3. **Cloudinary transforms not applied** → Verify API response includes transform params
4. **Images still large** → Check DevTools Network > Img, compare sizes

**Verification:**
```bash
# Verify API has cache headers
curl -I https://api.riselocal.in/tenants/slug/your-slug

# Should see:
# Cache-Control: public, max-age=300
```

### **Issue: LCP slow (>1.5s on desktop)**

**Likely Culprit:** Hero image not marked `priority=true`
```typescript
// Check hero.tsx
<Image
  src={bannerUrl}
  priority={true}  // ← Must be TRUE
  ...
/>
```

### **Issue: Mobile LCP > 2.5s**

**Likely Culprit:** Large unoptimized images in gallery
```bash
# In DevTools Network, filter Img:
# Each image should be <100KB after optimization
# If >200KB, Cloudinary transform not applied
```

### **Issue: API response still >1MB**

**Likely Culprit:** Pagination `take: 20` not applied
```typescript
// Check tenant.routes.ts line 226
galleryImages: {
  orderBy: [...],
  take: 20,  // ← Must be present
}
```

---

## 📈 STEP 7: CONTINUOUS MONITORING

### **Set Up Recurring Audits**

**Weekly Checklist:**
- [ ] Run Lighthouse on public pages (desktop + mobile)
- [ ] Compare to post-optimization baseline (should stay consistent)
- [ ] Check Vercel Analytics > Performance > LCP trend
- [ ] Monitor Render dashboard for API response times

**Monthly Review:**
- [ ] Download Lighthouse report as PDF
- [ ] Archive comparison data
- [ ] Alert if performance regresses >5%

### **Lighthouse CI (Advanced)**

```bash
# Install Lighthouse CI
npm install -g @lhci/cli@0.11.0

# Create .lighthouserc.json
cat > .lighthouserc.json << 'EOF'
{
  "ci": {
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "performance": ["error", { "minScore": 0.90 }],
        "accessibility": ["warn", { "minScore": 0.90 }],
        "best-practices": ["warn", { "minScore": 0.90 }]
      }
    }
  }
}
EOF

# Run automated audit
lhci autorun --config=.lighthouserc.json --upload.target=temporary-public-storage
```

---

## ✅ FINAL SIGN-OFF

**Audit Completed By:** ________________  
**Date:** ________________  
**Test Tenant:** ________________  

**Overall Result:**
- [ ] ✅ **PASS** — All optimizations validated, performance target met
- [ ] ⚠️ **PARTIAL** — Most optimizations working, minor gaps remain
- [ ] ❌ **FAIL** — Significant issues, requires investigation

**Notes/Issues Found:**
```
[Document any findings, anomalies, or follow-up actions]
```

**Next Actions:**
```
[List any remaining work or optimizations to pursue]
```

---

## 📞 SUPPORT REFERENCE

**Expected Improvements (from implementation):**
- Priority 1 (Images): -150-200ms
- Priority 2 (Pagination): -80-100ms
- Priority 3 (Fonts): -40-50ms
- Priority 4 (Cloudinary): -25-35ms
- Priority 5 (Cache): -20-30ms (repeat visits)

**Total Expected:** **-380-560ms (40-60% faster)**

**If actual results differ significantly, check:**
1. Deployment status (no rollback?)
2. Cache invalidation (old assets still served?)
3. Network throttling (test on real 4G, not just DevTools simulate?)
4. Test tenant configuration (images properly uploaded?)

---

**Questions?** Review the [Performance Audit Report](./PERFORMANCE_AUDIT_REPORT.md) or check implementation in:
- [next.config.js](apps/web/next.config.js)
- [cloudinary-transform.ts](apps/api/src/lib/cloudinary-transform.ts)
- [tenant.routes.ts](apps/api/src/modules/tenant/presentation/tenant.routes.ts)
