import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { AnalysisItem, getCategoryLabel, getCategoryColor, getCategoryBg } from '../utils/analysisEngine';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: AnalysisItem | null;
  person?: string;
}

export function DetailModal({ isOpen, onClose, item, person }: DetailModalProps) {
  if (!item) return null;

  const color = getCategoryColor(item.category);
  const bg = getCategoryBg(item.category);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[500px] p-0 border border-gray-200 rounded-2xl overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-3">
            <span
              className="inline-block px-3 py-1 rounded-full text-xs"
              style={{ backgroundColor: bg, color }}
            >
              {getCategoryLabel(item.category)}
            </span>
            {person && <span className="text-gray-400 text-sm font-normal">{person}</span>}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {getCategoryLabel(item.category)} 상세 내용
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-5">
          <div>
            <p className="text-gray-900 leading-relaxed">{item.text}</p>
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-2">핵심 키워드</p>
            <div className="flex flex-wrap gap-2">
              {item.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full text-sm"
                  style={{ backgroundColor: bg, color }}
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          {item.detailText && (
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2">상세 분석</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                {item.detailText}
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 leading-relaxed">
              {item.category === 'fact' && '객관적으로 확인 가능한 사건이나 행동입니다.'}
              {item.category === 'interpretation' && '사실에 대한 개인의 의미 부여나 추측입니다.'}
              {item.category === 'emotion' && '상황에서 느낀 감정 상태입니다.'}
              {item.category === 'need' && '진정으로 원하거나 필요로 하는 것입니다.'}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}