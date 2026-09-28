export type ActionPresetLocale = 'zh-TW' | 'en';

export interface ActionPresetCopy {
  label: string;
  animation_description: string;
  animation_trigger_scenario: string;
}

export interface ActionPresetDefinition {
  id: string;
  animation_name: string;
  zh: ActionPresetCopy;
  en: ActionPresetCopy;
}

/** 設定頁「建立自訂動作」的常用預設；套用後仍須自行加入 VRMA。 */
export const ACTION_PRESETS: readonly ActionPresetDefinition[] = [
  {
    id: 'wave-hello',
    animation_name: 'wave-hello',
    zh: {
      label: '揮手打招呼',
      animation_description: '友好的揮手動作，手臂抬起左右擺動。',
      animation_trigger_scenario: '使用者打招呼、開始對話，或代理想表示歡迎時。',
    },
    en: {
      label: 'Wave hello',
      animation_description: 'A friendly wave with the arm raised and moving side to side.',
      animation_trigger_scenario:
        'When the user greets, a conversation starts, or the agent wants to welcome them.',
    },
  },
  {
    id: 'greeting',
    animation_name: 'greeting',
    zh: {
      label: '問候',
      animation_description: '正式一點的問候姿勢（點頭或微鞠躬感）。',
      animation_trigger_scenario: '初次見面、開場介紹，或需要較正式的致意時。',
    },
    en: {
      label: 'Greeting',
      animation_description: 'A slightly formal greeting pose (nod or light bow feel).',
      animation_trigger_scenario:
        'First meetings, opening introductions, or when a more formal hello fits.',
    },
  },
  {
    id: 'happy',
    animation_name: 'happy',
    zh: {
      label: '開心',
      animation_description: '開心、雀躍的上半身動作。',
      animation_trigger_scenario: '好消息、任務成功，或使用者表達喜悅時。',
    },
    en: {
      label: 'Happy',
      animation_description: 'A cheerful upper-body celebration motion.',
      animation_trigger_scenario:
        'Good news, task success, or when the user expresses joy.',
    },
  },
  {
    id: 'nod',
    animation_name: 'nod',
    zh: {
      label: '點頭',
      animation_description: '肯定、同意的點頭。',
      animation_trigger_scenario: '表示同意、確認理解，或簡短回應「好的」時。',
    },
    en: {
      label: 'Nod',
      animation_description: 'An affirming nod.',
      animation_trigger_scenario:
        'To agree, confirm understanding, or briefly say yes.',
    },
  },
  {
    id: 'bow',
    animation_name: 'bow',
    zh: {
      label: '鞠躬',
      animation_description: '禮貌的鞠躬或致意。',
      animation_trigger_scenario: '道歉、道謝，或較正式的告別／致意時。',
    },
    en: {
      label: 'Bow',
      animation_description: 'A polite bow or formal gesture.',
      animation_trigger_scenario:
        'Apologies, thanks, or a more formal farewell.',
    },
  },
  {
    id: 'think',
    animation_name: 'think',
    zh: {
      label: '思考',
      animation_description: '思考中的姿勢（托腮或沉思感）。',
      animation_trigger_scenario: '正在推理、搜尋答案，或需要一點時間思考時。',
    },
    en: {
      label: 'Think',
      animation_description: 'A thoughtful pose (chin rest or pondering feel).',
      animation_trigger_scenario:
        'While reasoning, searching for an answer, or needing a moment to think.',
    },
  },
  {
    id: 'shrug',
    animation_name: 'shrug',
    zh: {
      label: '聳肩',
      animation_description: '不確定或無可奈何的聳肩。',
      animation_trigger_scenario: '資訊不足、無法確定，或輕鬆表示「不知道」時。',
    },
    en: {
      label: 'Shrug',
      animation_description: 'An uncertain or helpless shrug.',
      animation_trigger_scenario:
        'When information is missing, uncertain, or for a light “I don’t know”.',
    },
  },
  {
    id: 'clap',
    animation_name: 'clap',
    zh: {
      label: '拍手',
      animation_description: '拍手稱讚或鼓勵。',
      animation_trigger_scenario: '稱讚使用者、慶祝完成，或鼓勵繼續時。',
    },
    en: {
      label: 'Clap',
      animation_description: 'Clapping to praise or encourage.',
      animation_trigger_scenario:
        'To praise the user, celebrate progress, or encourage them to continue.',
    },
  },
  {
    id: 'dance',
    animation_name: 'dance',
    zh: {
      label: '跳舞',
      animation_description: '輕快的舞蹈或律動。',
      animation_trigger_scenario: '氣氛輕鬆、慶祝，或使用者要求娛樂性動作時。',
    },
    en: {
      label: 'Dance',
      animation_description: 'A light dance or rhythmic motion.',
      animation_trigger_scenario:
        'For a playful mood, celebration, or when the user asks for fun motion.',
    },
  },
  {
    id: 'finger-gun',
    animation_name: 'finger-gun',
    zh: {
      label: '手指槍',
      animation_description: '俏皮的手指槍姿勢。',
      animation_trigger_scenario: '輕鬆打趣、俏皮回應，或使用者要求這個經典動作時。',
    },
    en: {
      label: 'Finger gun',
      animation_description: 'A playful finger-gun pose.',
      animation_trigger_scenario:
        'For light teasing, a playful reply, or when the user asks for this classic gesture.',
    },
  },
];

export function resolveActionPreset(
  preset: ActionPresetDefinition,
  locale: ActionPresetLocale,
): CustomAnimationMetadata & { label: string } {
  const copy = locale === 'en' ? preset.en : preset.zh;
  return {
    label: copy.label,
    animation_name: preset.animation_name,
    animation_description: copy.animation_description,
    animation_trigger_scenario: copy.animation_trigger_scenario,
  };
}
