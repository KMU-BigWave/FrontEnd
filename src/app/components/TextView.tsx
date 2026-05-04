import { PersonAnalysis, AnalysisItem, getCategoryColor, getCategoryLabel } from '../utils/analysisEngine';

interface TextViewProps {
  personA?: PersonAnalysis;
  personB?: PersonAnalysis;
  solo?: PersonAnalysis;
  sharedFacts: AnalysisItem[];
  commonFacts: string[];
  similarNeeds: string[];
}

export function TextView({ personA, personB, solo, sharedFacts, commonFacts, similarNeeds }: TextViewProps) {
  const categories = ['fact', 'interpretation', 'emotion', 'need'] as const;

  if (solo) {
    return (
      <div className="space-y-8">
        {categories.map((category) => {
          const items = solo.items.filter(item => item.category === category);
          if (items.length === 0) return null;
          
          return (
            <div key={category} className="border-b border-gray-100 pb-8 last:border-0">
              <div
                className="inline-block px-3 py-1 rounded-full text-xs mb-4"
                style={{
                  backgroundColor: `${getCategoryColor(category)}15`,
                  color: getCategoryColor(category),
                }}
              >
                {getCategoryLabel(category)}
              </div>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                      style={{ backgroundColor: getCategoryColor(category) }}
                    />
                    <p className="text-gray-700 leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (personA && personB) {
    return (
      <div className="space-y-8">
        {(commonFacts.length > 0 || similarNeeds.length > 0) && (
          <div className="space-y-6">
            {commonFacts.length > 0 && (
              <div className="p-6 bg-[#F3E8FF] rounded-2xl">
                <h4 className="mb-3 text-[#8B5CF6]">공통으로 인식한 사실</h4>
                <div className="space-y-2">
                  {commonFacts.map((fact, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] mt-2 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{fact}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {similarNeeds.length > 0 && (
              <div className="p-6 bg-[#FFF0F3] rounded-2xl">
                <h4 className="mb-3 text-[#FF6B8A]">비슷한 욕구</h4>
                <div className="space-y-2">
                  {similarNeeds.map((need, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B8A] mt-2 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{need}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {[personA, personB].map((person) => (
            <div key={person.name}>
              <div className="border-b border-gray-200 pb-3 mb-6">
                <h3>{person.name}의 관점</h3>
              </div>
              
              <div className="space-y-6">
                {categories.map((category) => {
                  const items = person.items.filter(item => item.category === category);
                  if (items.length === 0) return null;
                  
                  return (
                    <div key={category}>
                      <div
                        className="inline-block px-2 py-1 rounded text-xs mb-3"
                        style={{
                          backgroundColor: `${getCategoryColor(category)}15`,
                          color: getCategoryColor(category),
                        }}
                      >
                        {getCategoryLabel(category)}
                      </div>
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div key={item.id} className="flex gap-3">
                            <div
                              className="w-1 h-1 rounded-full mt-2 flex-shrink-0"
                              style={{ backgroundColor: getCategoryColor(category) }}
                            />
                            <p className="text-sm text-gray-700 leading-relaxed">{item.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}