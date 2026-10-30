import { useLang } from '../i18n.jsx'

export default function DemoNotice() {
  const { t } = useLang()
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      ⓘ {t('demo')}
    </div>
  )
}
