import { useLang } from '../../context/LangContext';
import { PageHeader } from '../../components/common/Page';
import { AiChat } from '../../components/ai/AiChat';

export default function AskAiPage() {
  const { t } = useLang();
  return (
    <>
      <PageHeader title={t('ai.title')} subtitle={t('ai.sub')} testId="ask-ai-title" />
      <AiChat />
    </>
  );
}
