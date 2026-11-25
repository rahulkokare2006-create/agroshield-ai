"""
AGROSHIELD AI - Grounded Kisan Tomato AI Chatbot Service
=========================================================
Strictly grounded in verified ICAR-IIHR (Bengaluru) & TNAU Tomato Packages of Practices.
Provides voice-ready dialect responses in Kannada, Marathi, Hindi, and English.
Will NOT hallucinate unregistered chemicals or arbitrary dosages.
"""

from typing import Dict, Any, List
from ..schemas import ChatbotResponse

# Curated Agronomic Knowledge Base
TOMATO_KNOWLEDGE_BASE = [
    {
        "keywords": ["early blight", "alternaria", "target", "brown spot", "ಆರಂಭಿಕ ಬ್ಲೈಟ್", "ಕಂದು ಚುಕ್ಕೆ", "अर्ली ब्लाइट"],
        "topic": "Tomato Early Blight Management",
        "reply_kn": (
            "ಟೊಮೇಟೊ ಆರಂಭಿಕ ಬ್ಲೈಟ್ (ಅಲ್ಟರ್ನೇರಿಯಾ ಸೊಲಾನಿ) ಎಲೆಗಳ ಮೇಲೆ ಏಕಕೇಂದ್ರಕ ಉಂಗುರದಂತಹ ಕಂದು ಚುಕ್ಕೆಗಳನ್ನು ಉಂಟುಮಾಡುತ್ತದೆ. "
            "ಕ್ರಮಗಳು: 1. ಮಣ್ಣನ್ನು ಮುಟ್ಟುವ ಕೆಳಗಿನ 2 ಹಳದಿ ಎಲೆಗಳನ್ನು ಕಿತ್ತು ಮಣ್ಣಿನಲ್ಲಿ ಹೂತುಹಾಕಿ. "
            "2. ಆರಂಭಿಕ ಹಂತದಲ್ಲಿ ಟ್ರೈಕೋಡರ್ಮಾ ವಿರಿಡೆ (5 ಗ್ರಾಂ/ಲೀ) ಅಥವಾ ಬೇವಿನ ಎಣ್ಣೆ (3 ಮಿ.ಲೀ/ಲೀ) ಸಿಂಪಡಿಸಿ. "
            "3. ರೋಗ ಹೆಚ್ಚಿದ್ದರೆ CIBRC ಅನುಮೋದಿತ ಮ್ಯಾಂಕೋಜೆಬ್ 75% WP (ಪ್ರತಿ ಲೀಟರ್‌ಗೆ 2.0 ರಿಂದ 2.5 ಗ್ರಾಂ - ಅಂದರೆ 15 ಲೀಟರ್ ಪಂಪ್‌ಗೆ 35 ಗ್ರಾಂ) ಬೆರೆಸಿ ಎಲೆಗಳ ಕೆಳಭಾಗಕ್ಕೆ ಸಿಂಪಡಿಸಿ. "
            "4. ಕಟಾವಿಗೆ 5 ದಿನಗಳ ಮೊದಲು ಸಿಂಪಡಿಸಬೇಡಿ (PHI)."
        ),
        "reply_en": (
            "Tomato Early Blight (Alternaria solani) causes dark brown concentric target-ring spots on lower foliage. "
            "Recommended Actions: 1. Pluck and bury the lowest 2 leaves touching the wet soil. "
            "2. At initial sign, spray Trichoderma viride (5g/L) or Neem oil (3ml/L). "
            "3. Under active infection, apply CIBRC-registered Mancozeb 75% WP at 2.0-2.5 g/L (30-37.5g per 15L pump) targeting leaf undersides. "
            "4. Maintain a 5-day Pre-Harvest Interval (PHI). Wear mask and gloves."
        ),
        "reply_mr": (
            "टोमॅटो अर्ली ब्लाइट (अल्टरनेरिया) पानांवर गोलाकार तपकिरी ठिपके निर्माण करतो. "
            "उपाय: १. जमिनीला टेकलेली खालची २ पिवळी पाने काढून टाका. "
            "२. जैविक संरक्षणासाठी ट्रायकोडर्मा (५ ग्रॅम/लीटर) किंवा निंबोळी अर्क फवारा. "
            "३. प्रादुर्भाव जास्त असल्यास मँकोझेब ७५% WP (२.० ते २.५ ग्रॅम प्रति लिटर - १५ लिटर पंपाला ३५ ग्रॅम) पानांच्या खालून फवारा. "
            "४. फवारणीनंतर ५ दिवस तोडणी करू नका."
        ),
        "reply_hi": (
            "टमाटर अगेती झुलसा (अल्टर्नेरिया) पत्तियों पर छल्लेदार भूरे धब्बे बनाता है। "
            "उपाय: 1. जमीन से छूने वाली निचली पत्तियों को तोड़कर नष्ट करें। "
            "2. ट्राइकोडर्मा विरिडे (5 ग्राम/लीटर) या नीम तेल (3 मिली/लीटर) का छिड़काव करें। "
            "3. प्रकोप होने पर मैंकोज़ेब 75% WP (2.0 से 2.5 ग्राम प्रति लीटर पानी - 15 लीटर पंप में 35 ग्राम) पत्तियों के नीचे छिड़कें। "
            "4. तुड़ाई से 5 दिन पहले छिड़काव न करें।"
        ),
        "source": "ICAR-IIHR Tomato Package of Practices & CIBRC Approved Label",
        "followups": ["What is the pump dosage?", "How to prune lower leaves?", "Can I use drip fertigation?"]
    },
    {
        "keywords": ["flower drop", "blossom drop", "flowers falling", "ಹೂ ಉದುರುವುದು", "ಹೂವು", "फूल गिरना", "फुलगळ"],
        "topic": "Tomato Blossom Drop & Fruit Set",
        "reply_kn": (
            "ಟೊಮೇಟೊದಲ್ಲಿ ಹೂ ಉದುರಲು ಬೋರಾನ್ ಕೊರತೆ, ಹಠಾತ್ ತಾಪಮಾನ ಏರಿಕೆ ಅಥವಾ ಅತಿಯಾದ ತೇವಾಂಶ ಕಾರಣ. "
            "ಪರಿಹಾರ: 1. ಹೂ ಬಿಡುವ ಹಂತದಲ್ಲಿ ಹನಿ ನೀರಾವರಿಯನ್ನು ಸಮತೋಲನದಲ್ಲಿಡಿ (ಅತಿಯಾಗಿ ನೀರು ಹಾಯಿಸಬೇಡಿ). "
            "2. ಬೋರಾನ್ 20% (ಪ್ರತಿ ಲೀಟರ್‌ಗೆ 1 ಗ್ರಾಂ) ಮತ್ತು 12:61:00 (ಪ್ರತಿ ಲೀಟರ್‌ಗೆ 4-5 ಗ್ರಾಂ) ಬೆರೆಸಿ ಸಂಜೆ ವೇಳೆಯಲ್ಲಿ ಸಿಂಪಡಿಸಿ."
        ),
        "reply_en": (
            "Tomato flower drop is typically caused by Boron deficiency, extreme diurnal temperature swings, or excess soil moisture. "
            "Solutions: 1. Regulate drip irrigation during flowering; avoid water stress or waterlogging. "
            "2. Apply foliar spray of Solubor/Boron 20% @ 1.0 g/L combined with 12:61:00 (MAP) @ 4-5 g/L during early morning or late evening."
        ),
        "reply_mr": (
            "टोमॅटोची फुलगळ ही बोरॉनची कमतरता किंवा पाण्याचा ताण/अति पाणी यामुळे होते. "
            "उपाय: १. फुलोरा अवस्थेत पाणी नियोजन संतुलित ठेवा. "
            "२. बोरॉन २०% (१ ग्रॅम/लीटर) आणि १२:६१:०० (४-५ ग्रॅम/लीटर) एकत्र करून संध्याकाळी फवारणी करा."
        ),
        "reply_hi": (
            "टमाटर में फूल गिरना बोरॉन की कमी या अधिक नमी/तापमान के कारण होता है। "
            "समाधान: 1. फूल आते समय सिंचाई संतुलित रखें। "
            "2. बोरॉन 20% (1 ग्राम/लीटर) और 12:61:00 (4-5 ग्राम/लीटर) का छिड़काव शाम के समय करें।"
        ),
        "source": "TNAU Agritech Portal - Horticultural Crop Physiology",
        "followups": ["What fertilizer during flowering?", "How much boron per pump?", "Ideal watering time"]
    },
    {
        "keywords": ["blossom end rot", "black bottom", "calcium", "ತಳ ಕಪ್ಪು", "ಕೆಳಭಾಗ ಕಪ್ಪು", "ब्लॉसम एंड रॉट"],
        "topic": "Blossom End Rot (Physiological Disorder)",
        "reply_kn": (
            "ಟೊಮೇಟೊ ಕಾಯಿಯ ತಳಭಾಗ ಕಪ್ಪಾಗುವುದು (ಬ್ಲಾಸಮ್ ಎಂಡ್ ರಾಟ್) ರೋಗವಲ್ಲ! ಇದು ಕ್ಯಾಲ್ಸಿಯಂ ಕೊರತೆ ಮತ್ತು ಅಸಮತೋಲಿತ ನೀರಾವರಿಯಿಂದ ಬರುತ್ತದೆ. "
            "ಪರಿಹಾರ: 1. ಹನಿ ನೀರಾವರಿಯನ್ನು ನಿಯಮಿತವಾಗಿ ನೀಡಿ, ಮಣ್ಣು ಒಣಗದಂತೆ ನೋಡಿಕೊಳ್ಳಿ. "
            "2. ಕ್ಯಾಲ್ಸಿಯಂ ನೈಟ್ರೇಟ್ (ಪ್ರತಿ ಲೀಟರ್‌ಗೆ 3-4 ಗ್ರಾಂ) ಸಿಂಪಡಿಸಿ. ಶಿಲೀಂಧ್ರನಾಶಕ ಹಾಕಬೇಡಿ."
        ),
        "reply_en": (
            "Blossom End Rot (black, sunken bottom on tomato fruit) is NOT a fungal disease! "
            "It is a physiological disorder caused by Calcium deficiency induced by fluctuating soil moisture. "
            "Remedy: 1. Maintain steady, uniform drip irrigation (never let root zone dry completely). "
            "2. Apply foliar Calcium Nitrate @ 3-4 g/L during active fruit expansion. Fungicides will not fix this."
        ),
        "reply_mr": (
            "फळाच्या खालच्या बाजूला काळा डाग पडणे हा बुरशीजन्य रोग नसून कॅल्शियमच्या कमतरतेमुळे होणारा विकार आहे. "
            "उपाय: १. ठिबक सिंचनाद्वारे जमिनीतील ओलावा सतत टिकवून ठेवा. "
            "२. कॅल्शियम नायट्रेट ३-४ ग्रॅम प्रति लिटर पाण्यात मिसळून फवारा."
        ),
        "reply_hi": (
            "टमाटर के निचले हिस्से का काला पड़ना कोई फंगल बीमारी नहीं है, यह कैल्शियम की कमी से होता है। "
            "समाधान: 1. ड्रिप से नियमित सिंचाई करें, मिट्टी को सूखने न दें। "
            "2. कैल्शियम नाइट्रेट (3-4 ग्राम/लीटर) का पर्णीय छिड़काव करें। कीटनाशक न डालें।"
        ),
        "source": "ICAR-IIHR Tomato Physiological Disorders Bulletin",
        "followups": ["Calcium nitrate dosage", "Irrigation schedule", "Organic calcium sources"]
    },
    {
        "keywords": ["spacing", "staking", "trellis", "ಅಂತರ", "ಕಡ್ಡಿ ಕಟ್ಟುವುದು", "अंतर", "बांबू बांधणी"],
        "topic": "Spacing, Staking & Trellising",
        "reply_kn": (
            "ಟೊಮೇಟೊ ಬೆಳೆಯ ಶಿಫಾರಸು ಅಂತರ: ಸಾಲಿನಿಂದ ಸಾಲಿಗೆ 90 ಸೆಂ.ಮೀ (3 ಅಡಿ), ಗಿಡದಿಂದ ಗಿಡಕ್ಕೆ 45-60 ಸೆಂ.ಮೀ (1.5-2 ಅಡಿ). "
            "ಬಿದಿರಿನ ಕಡ್ಡಿ ಅಥವಾ ಜಿಐ ತಂತಿಯಿಂದ ಗಿಡವನ್ನು ಕಟ್ಟುವುದು ಅತಿ ಮುಖ್ಯ. ಇದರಿಂದ ಕಾಯಿಗಳು ಮಣ್ಣಿಗೆ ತಾಗದೆ ಆರಂಭಿಕ ಬ್ಲೈಟ್ ರೋಗವು 70% ಕಡಿಮೆಯಾಗುತ್ತದೆ."
        ),
        "reply_en": (
            "Recommended tomato spacing: Row-to-row 90 cm (3 ft), plant-to-plant 45-60 cm (1.5-2 ft). "
            "Bamboo or GI wire staking is critical for indeterminate hybrids (like Arka Rakshak). "
            "Staking prevents foliage and fruit from contacting damp soil, reducing Early Blight incidence by over 70%."
        ),
        "reply_mr": (
            "टोमॅटो लागवडीचे योग्य अंतर: दोन ओळींमध्ये ९० सेमी (३ फूट) आणि दोन रोपांमध्ये ४५-६० सेमी ठेवा. "
            "बांबू आणि तारेच्या साहाय्याने झाडांना आधार देणे (स्टेकिंग) अत्यंत महत्त्वाचे आहे, यामुळे अर्ली ब्लाइट रोगाचा प्रादुर्भाव ७०% कमी होतो."
        ),
        "reply_hi": (
            "टमाटर की दूरी: कतार से कतार 90 सेमी और पौधे से पौधा 45-60 सेमी रखें। "
            "बांस या तार से पौधों को सहारा (स्टेकिंग) अवश्य दें। इससे फल मिट्टी के संपर्क में नहीं आते और झुलसा रोग 70% तक कम होता है।"
        ),
        "source": "ICAR-IIHR Recommended Horticultural Cultural Practices",
        "followups": ["How to prune side shoots?", "Best tomato varieties", "Mulching paper benefits"]
    }
]

def ask_kisan_chatbot(user_message: str, language_code: str = "kn") -> ChatbotResponse:
    query = user_message.lower().strip()
    
    # Keyword matching against knowledge base
    best_match = None
    for entry in TOMATO_KNOWLEDGE_BASE:
        for kw in entry["keywords"]:
            if kw in query:
                best_match = entry
                break
        if best_match:
            break
            
    if best_match:
        lang = language_code if language_code in ["kn", "en", "mr", "hi"] else "kn"
        reply_key = f"reply_{lang}"
        reply_text = best_match.get(reply_key, best_match["reply_en"])
        
        return ChatbotResponse(
            reply_text=reply_text,
            reply_audio_text=reply_text,
            source_reference=best_match["source"],
            confidence_topic=best_match["topic"],
            suggested_followups=best_match["followups"]
        )

    # General Tomato Agronomy Fallback
    fallback_texts = {
        "kn": (
            "ನಾನು ಟೊಮೇಟೊ ಕೃಷಿ AI ಸಹಾಯಕ. ನೀವು ಆರಂಭಿಕ ಬ್ಲೈಟ್ ರೋಗ, ಹೂ ಉದುರುವುದು, ಬ್ಲಾಸಮ್ ಎಂಡ್ ರಾಟ್, "
            "ಗಿಡದ ಅಂತರ ಅಥವಾ ರಸಗೊಬ್ಬರಗಳ ಬಗ್ಗೆ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಬಹುದು. ಉದಾಹರಣೆಗೆ: 'ಹೂ ಉದುರುವುದನ್ನು ತಡೆಯುವುದು ಹೇಗೆ?'"
        ),
        "en": (
            "I am the Kisan Tomato Agronomy Assistant. You can ask me about Early Blight, flower drop, "
            "Blossom End Rot, spacing, trellising, or stage-by-stage fertilizers. For example: 'How to manage tomato early blight?'"
        ),
        "mr": (
            "मी किसान टोमॅटो कृषी AI सहाय्यक आहे. तुम्ही अर्ली ब्लाइट, फुलगळ, खत व्यवस्थापन किंवा "
            "झाडांना आधार देण्याबद्दल विचारू शकता. उदाहरणार्थ: 'फुलगळ कशी रोखावी?'"
        ),
        "hi": (
            "मैं किसान टमाटर कृषि AI सहायक हूँ। आप अगेती झुलसा, फूल गिरना, दूरी या खाद के बारे में सवाल पूछ सकते हैं।"
        )
    }
    
    reply = fallback_texts.get(language_code, fallback_texts["en"])
    return ChatbotResponse(
        reply_text=reply,
        reply_audio_text=reply,
        source_reference="ICAR-IIHR Tomato Agronomy Knowledge Repository",
        confidence_topic="General Tomato Advisory",
        suggested_followups=["How to prevent early blight?", "Tomato spacing guide", "Why are flowers dropping?"]
    )
