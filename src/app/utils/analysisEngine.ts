// Mock AI analysis engine
export interface AnalysisItem {
  id: string;
  text: string;
  category: 'fact' | 'interpretation' | 'emotion' | 'need';
  keywords: string[];
  detailText: string; // Detailed analysis text for the item
}

export interface PersonAnalysis {
  name: string;
  items: AnalysisItem[];
  summary: string;
}

export interface ConflictAnalysis {
  mode: 'two-person' | 'solo';
  personA?: PersonAnalysis;
  personB?: PersonAnalysis;
  solo?: PersonAnalysis;
  sharedFacts: AnalysisItem[]; // Facts shared between both people
  commonFacts: string[];
  commonKeywords: string[];
  divergentInterpretations: { personA?: string; personB?: string }[];
  unrecognizedEmotions: { person: string; emotion: string }[];
  similarNeeds: string[];
  situationSummary: string;
}

// Mock AI analysis for two-person mode (free-form text)
export function analyzeTwoPersonConflict(
  personA: { name: string; text: string },
  personB: { name: string; text: string }
): ConflictAnalysis {
  const nameA = personA.name || '첫 번째 사람';
  const nameB = personB.name || '두 번째 사람';

  // Shared facts — objective events both people experienced
  const sharedFacts: AnalysisItem[] = [
    {
      id: 'shared-fact-1',
      text: '약속 시간에 30분 늦게 도착',
      category: 'fact',
      keywords: ['30분 지각', '약속 시간'],
      detailText: `두 사람 모두 인정하는 객관적 사실입니다. ${nameA}님과 ${nameB}님은 정해진 시간에 만나기로 했으나, 실제 만남은 약속 시간보다 약 30분 뒤에 이루어졌습니다. 이 지연이 갈등의 출발점이 되었으며, 같은 사건에 대해 두 사람은 매우 다른 의미를 부여하고 있습니다.`,
    },
    {
      id: 'shared-fact-2',
      text: '사전 연락 없이 늦음',
      category: 'fact',
      keywords: ['연락 없음', '사전 통보'],
      detailText: `늦는다는 사전 연락이 없었다는 점 역시 두 사람 모두가 인지하는 사실입니다. ${nameB}님은 회의 중이라 연락이 어려웠다고 설명하지만, 연락이 없었다는 사실 자체는 양쪽 모두 동의합니다. 이 '연락 부재'가 ${nameA}님에게는 무시의 신호로, ${nameB}님에게는 불가항력으로 해석되면서 갈등이 증폭되었습니다.`,
    },
    {
      id: 'shared-fact-3',
      text: '회의가 예상보다 길어짐',
      category: 'fact',
      keywords: ['회의 지연', '업무 상황'],
      detailText: `${nameB}님이 참석한 회의가 예정보다 길어진 것은 객관적으로 확인 가능한 사실입니다. ${nameA}님도 나중에 이 상황을 인지하게 되었습니다. 다만, 이 사실에 대해 ${nameA}님은 '그래도 연락은 할 수 있었을 것'이라는 해석을, ${nameB}님은 '정말 어쩔 수 없는 상황이었다'는 해석을 하고 있어, 같은 사실이 전혀 다른 결론으로 이어지고 있습니다.`,
    },
  ];

  const personAAnalysis: PersonAnalysis = {
    name: nameA,
    summary: `${nameA}님은 상대의 행동에서 존중의 부재를 느끼고 있습니다. 약속 시간에 늦은 것 자체보다, 미리 연락이 없었다는 점에서 자신이 중요하지 않게 여겨진다는 해석이 핵심입니다. 화남과 서운함이 동시에 작용하고 있으며, 근본적으로는 사전 소통과 시간에 대한 존중을 원하고 있습니다.`,
    items: [
      {
        id: 'a-interp-1',
        text: '나를 중요하게 생각하지 않는 것 같다',
        category: 'interpretation',
        keywords: ['무시', '중요도'],
        detailText: `${nameA}님은 사전 연락 없이 늦은 행동을 '나를 중요하게 여기지 않는다'는 의미로 해석하고 있습니다. 이것은 사실이 아니라 해석입니다. 상대의 의도와 관계없이, ${nameA}님의 마음속에서 자동으로 형성된 의미 부여입니다. 과거 비슷한 경험이 축적되면서 이런 해석이 더 강화되었을 가능성이 있으며, 이는 '확증 편향'의 일종으로 볼 수 있습니다.`,
      },
      {
        id: 'a-interp-2',
        text: '무책임한 태도라고 느낌',
        category: 'interpretation',
        keywords: ['무책임', '태도'],
        detailText: `${nameA}님은 상대의 지각을 단순한 실수가 아닌 '태도의 문제'로 해석하고 있습니다. 이 해석 속에는 '약속은 반드시 지켜야 한다'는 강한 가치관이 깔려 있습니다. 이러한 해석이 감정적 반응을 더 크게 만들고 있으며, 상대의 상황적 맥락보다 행동의 결과에 초점을 맞추고 있는 것으로 보입니다.`,
      },
      {
        id: 'a-emo-1',
        text: '화가 났다',
        category: 'emotion',
        keywords: ['화남', '분노'],
        detailText: `화남은 ${nameA}님이 가장 먼저 인식하는 감정입니다. 이 분노는 '나의 시간이 존중받지 못했다'는 인식에서 비롯됩니다. 심리학적으로 분노는 종종 '2차 감정'으로, 그 아래에는 상처, 서운함, 무력감 등 더 연약한 감정이 숨어 있을 수 있습니다. ${nameA}님의 경우에도 화남 아래에 서운함이 함께 작용하고 있습니다.`,
      },
      {
        id: 'a-emo-2',
        text: '무시당한 것 같아 서운했다',
        category: 'emotion',
        keywords: ['서운함', '무시'],
        detailText: `서운함은 화남보다 더 깊은 층위의 감정입니다. ${nameA}님은 단순히 시간을 낭비한 것에 대한 불만이 아니라, '나라는 사람이 가볍게 취급당했다'는 느낌을 받고 있습니다. 이 서운함은 관계의 질에 대한 불안과도 연결되어 있으며, '나는 이 관계에서 소중한 사람인가?'라는 근본적인 질문으로 이어질 수 있습니다.`,
      },
      {
        id: 'a-need-1',
        text: '늦을 때 미리 연락해줬으면',
        category: 'need',
        keywords: ['사전 소통', '연락'],
        detailText: `${nameA}님의 핵심 요구는 '사전 소통'입니다. 늦는 것 자체보다 연락 없이 기다리게 한 것이 더 큰 문제였습니다. 이 요구는 매우 구체적이고 실현 가능한 것으로, '다음에 비슷한 상황이 생기면 문자 한 통이라도 보내달라'는 형태로 명확히 전달할 수 있습니다. 이것이 갈등 해소의 가장 실질적인 출발점이 될 수 있습니다.`,
      },
      {
        id: 'a-need-2',
        text: '내 시간도 소중하게 여겨지길',
        category: 'need',
        keywords: ['존중', '시간 존중'],
        detailText: `시간에 대한 존중 요구의 이면에는 '나라는 존재에 대한 존중'이라는 더 근본적인 욕구가 있습니다. ${nameA}님에게 시간 약속을 지키는 것은 단순한 매너가 아니라, 상대가 나를 얼마나 중요하게 생각하는지를 판단하는 기준입니다. 이 가치관을 상대에게 명확히 전달하는 것이 상호 이해의 첫 걸음입니다.`,
      },
    ],
  };

  const personBAnalysis: PersonAnalysis = {
    name: nameB,
    summary: `${nameB}님은 불가피한 상황에 대한 이해를 바라고 있습니다. 회의가 길어진 것은 자신의 선택이 아니었으며, 그럼에도 비난받는 것에 답답함을 느끼고 있습니다. 미안함과 무력감이 동시에 존재하며, 자신의 노력과 상황에 대한 이해를 원하고 있습니다.`,
    items: [
      {
        id: 'b-interp-1',
        text: '상대가 내 상황을 이해 못하는 것 같다',
        category: 'interpretation',
        keywords: ['이해 부족', '상황 인식'],
        detailText: `${nameB}님은 자신의 상황이 불가항력이었음에도 상대가 이를 이해하지 못한다고 느끼고 있습니다. 이 해석에는 '나는 일부러 그런 것이 아닌데 왜 비난받아야 하는가'라는 억울함이 담겨 있습니다. 그러나 이것 역시 해석일 수 있습니다. ${nameA}님이 실제로 이해하지 못하는 것인지, 아니면 이해하더라도 감정적으로 받아들이기 어려운 것인지는 구분할 필요가 있습니다.`,
      },
      {
        id: 'b-interp-2',
        text: '너무 엄격하게 보는 것 같다',
        category: 'interpretation',
        keywords: ['과도한 기대', '엄격함'],
        detailText: `${nameB}님은 상대의 반응이 상황에 비해 과도하다고 느끼고 있습니다. '30분 늦은 것에 이렇게까지 화를 낼 일인가?'라는 생각이 깔려 있으며, 이는 두 사람 사이의 '시간 약속에 대한 가치관 차이'를 보여줍니다. ${nameB}님에게는 불가피한 상황이 충분한 변명이 되지만, ${nameA}님에게는 그렇지 않다는 인식 차이가 갈등의 핵심 축 중 하나입니다.`,
      },
      {
        id: 'b-emo-1',
        text: '미안했지만 어쩔 수 없었다',
        category: 'emotion',
        keywords: ['미안함', '무력감'],
        detailText: `${nameB}님은 미안함과 무력감이라는 복합 감정을 동시에 느끼고 있습니다. 미안하다는 감정은 진심이지만, 동시에 '내가 통제할 수 없는 상황이었는데'라는 무력감도 작용합니다. 이 두 감정 사이에서 갈등이 생기며, 제대로 사과하기도, 자신을 방어하기도 어려운 상태에 놓여 있습니다.`,
      },
      {
        id: 'b-emo-2',
        text: '오해받는 것 같아 답답했다',
        category: 'emotion',
        keywords: ['답답함', '오해'],
        detailText: `답답함은 ${nameB}님이 가장 강하게 느끼는 감정입니다. 자신의 진의가 전달되지 않고 있다는 느낌, 의도와 달리 '무책임한 사람'으로 비춰지고 있다는 인식이 이 답답함을 만들어내고 있습니다. 소통의 단절에서 오는 고립감과도 연결되며, '아무리 설명해도 상대가 들어주지 않을 것 같다'는 무력감이 동반됩니다.`,
      },
      {
        id: 'b-need-1',
        text: '내 상황을 이해해줬으면',
        category: 'need',
        keywords: ['이해', '맥락 파악'],
        detailText: `${nameB}님이 가장 원하는 것은 '상황적 맥락에 대한 이해'입니다. 일부러 늦은 것이 아니라는 점, 회의 중이라 연락도 어려웠다는 점을 상대가 인정해주길 바랍니다. 이 요구의 핵심은 '의도를 결과와 분리해서 봐달라'는 것입니다. 결과적으로 늦었지만 의도적으로 약속을 가볍게 여긴 것은 아니라는 점을 이해받고 싶어합니다.`,
      },
      {
        id: 'b-need-2',
        text: '노력을 인정받고 싶다',
        category: 'need',
        keywords: ['인정', '노력 존중'],
        detailText: `${nameB}님은 회의가 끝나자마자 서둘러 온 자신의 노력이 인정받길 원합니다. 이 요구 속에는 '나도 이 약속을 중요하게 생각하고 있다'는 메시지가 담겨 있습니다. 인정받고자 하는 욕구는 ${nameA}님의 존중받고자 하는 욕구와 사실상 같은 방향을 가리키고 있어, 이 지점이 두 사람의 접점이 될 수 있습니다.`,
      },
    ],
  };

  return {
    mode: 'two-person',
    personA: personAAnalysis,
    personB: personBAnalysis,
    sharedFacts,
    commonFacts: ['약속 시간이 지남', '연락이 없었음'],
    commonKeywords: ['약속', '연락', '시간'],
    divergentInterpretations: [
      {
        personA: '나를 중요하게 생각하지 않는다',
        personB: '상황이 어쩔 수 없었다',
      },
    ],
    unrecognizedEmotions: [
      { person: nameA, emotion: '서운함과 무시당한 느낌' },
      { person: nameB, emotion: '미안함과 답답함' },
    ],
    similarNeeds: ['서로를 이해받고 싶음', '존중받고 싶음'],
    situationSummary: `${nameA}님과 ${nameB}님 사이의 갈등은 '약속 시간 지각'이라는 동일한 사건을 둘러싸고, 서로 다른 해석과 감정이 작동하면서 발생했습니다. 두 사람 모두 근본적으로는 서로에 대한 존중과 이해를 원하고 있으며, 이는 갈등 해소의 실마리가 됩니다.`,
  };
}

// Mock AI analysis for solo mode (free-form text)
export function analyzeSoloThoughts(data: { text: string }): ConflictAnalysis {
  const soloAnalysis: PersonAnalysis = {
    name: '나',
    summary: '팀 내에서 자신의 의견이 충분히 반영되지 않는다는 인식이 핵심입니다. 객관적 사실(의견 미채택)에 "무시당한다"는 해석이 더해지면서, 답답함·좌절·자존감 저하 등 복합적 감정이 생겨나고 있습니다. 근본적으로는 존중, 기여감, 인정이라는 보편적인 욕구가 충족되지 않고 있습니다.',
    items: [
      {
        id: 's-fact-1',
        text: '팀 회의에서 내 의견이 채택되지 않음',
        category: 'fact',
        keywords: ['의견 미채택'],
        detailText: '최근 팀 회의에서 제안한 의견들이 최종 결정에 반영되지 않은 것은 확인 가능한 사실입니다. 다만, 의견이 채택되지 않은 이유가 무엇인지 객관적으로 분석해볼 필요가 있습니다.',
      },
      {
        id: 's-fact-2',
        text: '다른 사람들의 아이디어가 더 많이 논의됨',
        category: 'fact',
        keywords: ['타인 우선'],
        detailText: '회의에서 다른 팀원들의 아이디어가 더 많은 시간을 할애받아 논의된 것은 관찰 가능한 사실입니다. 이것이 의도적인 배제인지, 발언 타이밍이나 방식의 차이인지는 구분이 필요합니다.',
      },
      {
        id: 's-interp-1',
        text: '내 말투가 자신감 없어 보이는 것 같다',
        category: 'interpretation',
        keywords: ['자신감 부족'],
        detailText: '자신의 발표 방식에 대한 자체 평가입니다. 이것은 사실이 아닌 해석이며, 실제로 다른 사람들이 그렇게 느끼는지는 확인되지 않았습니다. 자기 인식과 타인의 인식 사이에는 차이가 있을 수 있습니다.',
      },
      {
        id: 's-interp-2',
        text: '팀원들이 나를 무시하는 것 같다',
        category: 'interpretation',
        keywords: ['무시'],
        detailText: '의견이 채택되지 않는 상황을 "무시"로 해석하고 있습니다. 그러나 의견 미채택과 인격적 무시는 다른 차원의 문제입니다. 이 해석이 사실인지, 아니면 감정이 만들어낸 과잉 해석인지 점검해볼 필요가 있습니다.',
      },
      {
        id: 's-interp-3',
        text: '내 아이디어가 별로인 걸지도',
        category: 'interpretation',
        keywords: ['자기 의심'],
        detailText: '자기 의심은 반복적인 좌절 경험에서 자연스럽게 생겨나는 해석입니다. 그러나 아이디어의 질과 채택 여부는 항상 비례하지 않으며, 조직의 우선순위, 타이밍, 발표 방식 등 다양한 요인이 관여합니다.',
      },
      {
        id: 's-emo-1',
        text: '답답하고 좌절감이 든다',
        category: 'emotion',
        keywords: ['답답함', '좌절'],
        detailText: '답답함과 좌절감은 노력에 비해 결과가 따라오지 않을 때 느끼는 자연스러운 감정입니다. 이 감정 자체는 부정적인 것이 아니며, 현재 상황에 변화가 필요하다는 내면의 신호일 수 있습니다.',
      },
      {
        id: 's-emo-2',
        text: '자존감이 떨어진다',
        category: 'emotion',
        keywords: ['자존감 저하'],
        detailText: '업무적 성과와 자존감을 연결짓고 있습니다. 의견이 받아들여지지 않는 것이 반복되면서 자기 가치감 전체가 흔들리고 있는 상태입니다. 업무적 역량과 인간적 가치를 분리해서 바라보는 연습이 필요합니다.',
      },
      {
        id: 's-emo-3',
        text: '팀원들에게 화가 난다',
        category: 'emotion',
        keywords: ['화남'],
        detailText: '화남은 좌절감이 외부로 향한 형태입니다. 팀원들에 대한 분노 속에는 "왜 내 기여를 알아주지 않는가"라는 호소가 담겨 있으며, 이는 관계 속에서 인정받고 싶은 욕구의 표현입니다.',
      },
      {
        id: 's-need-1',
        text: '내 의견이 존중받고 싶다',
        category: 'need',
        keywords: ['존중'],
        detailText: '존중은 가장 보편적이고 핵심적인 인간 욕구 중 하나입니다. 의견이 반드시 채택되기를 원하는 것이 아니라, 충분히 경청되고 진지하게 검토되는 과정을 경험하고 싶은 것입니다.',
      },
      {
        id: 's-need-2',
        text: '팀에 기여하는 느낌을 받고 싶다',
        category: 'need',
        keywords: ['기여감'],
        detailText: '기여감은 소속감과 직결되는 욕구입니다. 팀의 일원으로서 의미 있는 역할을 하고 있다는 느낌이 없으면, 동기 저하와 이탈 욕구로 이어질 수 있습니다.',
      },
      {
        id: 's-need-3',
        text: '내 능력을 인정받고 싶다',
        category: 'need',
        keywords: ['인정'],
        detailText: '인정 욕구는 자기 효능감과 연결됩니다. 노력과 능력이 타인에 의해 인정받을 때 자신감이 강화되고, 더 적극적인 참여가 가능해집니다. 이 욕구를 직접적으로 표현하는 것이 중요합니다.',
      },
    ],
  };

  return {
    mode: 'solo',
    solo: soloAnalysis,
    sharedFacts: [],
    commonFacts: [],
    commonKeywords: [],
    divergentInterpretations: [],
    unrecognizedEmotions: [],
    similarNeeds: [],
    situationSummary: '팀 내에서의 인정과 존중에 대한 복합적인 고민입니다.',
  };
}

export function getCategoryColor(category: string): string {
  switch (category) {
    case 'fact':
      return '#6366F1';
    case 'interpretation':
      return '#F59E0B';
    case 'emotion':
      return '#FF6B8A';
    case 'need':
      return '#10B981';
    default:
      return '#6B7280';
  }
}

export function getCategoryBg(category: string): string {
  switch (category) {
    case 'fact':
      return '#EEF2FF';
    case 'interpretation':
      return '#FEF3C7';
    case 'emotion':
      return '#FFF0F3';
    case 'need':
      return '#D1FAE5';
    default:
      return '#F3F4F6';
  }
}

export function getCategoryLabel(category: string): string {
  switch (category) {
    case 'fact':
      return '사실';
    case 'interpretation':
      return '해석';
    case 'emotion':
      return '감정';
    case 'need':
      return '요구';
    default:
      return '';
  }
}
