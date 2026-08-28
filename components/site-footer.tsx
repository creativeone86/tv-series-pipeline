'use client';

import { useLocale } from '@/hooks/use-locale';

export function SiteFooter() {
  const { t } = useLocale();
  return (
    <footer className="px-[5vw] py-[60px] bg-[#0A0A0A] border-t border-[var(--border)]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <div className="flex flex-col mb-3">
            <span className="text-[22px] font-bold brand-gradient">{t.auth.brand}</span>
            <span className="text-xs text-[var(--soft)]">QingFeng Manju</span>
          </div>
          <p className="text-sm text-[var(--soft)]">AI Animation Agent Studio</p>
          <p className="text-sm text-[var(--soft)] mt-1">hello@qfmanju.ai</p>
        </div>
        <div>
          <h4 className="font-semibold mb-3">{t.sharedUi.footerProduct}</h4>
          <p className="text-sm text-[var(--soft)] mb-1.5">{t.sharedUi.footerFeatures}</p>
          <p className="text-sm text-[var(--soft)] mb-1.5">{t.sharedUi.footerPricing}</p>
          <p className="text-sm text-[var(--soft)] mb-1.5">{t.sharedUi.footerCases}</p>
        </div>
        <div>
          <h4 className="font-semibold mb-3">{t.sharedUi.footerCompany}</h4>
          <p className="text-sm text-[var(--soft)] mb-1.5">{t.sharedUi.footerAbout}</p>
          <p className="text-sm text-[var(--soft)] mb-1.5">{t.sharedUi.footerCareers}</p>
          <p className="text-sm text-[var(--soft)] mb-1.5">{t.sharedUi.footerPrivacy}</p>
        </div>
        <div>
          <h4 className="font-semibold mb-3">{t.sharedUi.footerResources}</h4>
          <p className="text-sm text-[var(--soft)] mb-1.5">{t.sharedUi.footerDocs}</p>
          <p className="text-sm text-[var(--soft)] mb-1.5">{t.sharedUi.footerSupport}</p>
        </div>
      </div>
    </footer>
  );
}
