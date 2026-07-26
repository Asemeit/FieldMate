import { CropType, DiseaseRecommendation } from '../types';

export const DISEASE_DATABASE: Record<CropType, DiseaseRecommendation[]> = {
  Maize: [
    {
      diseaseName: "Common Rust",
      confidence: 94,
      severity: "Medium",
      symptoms: [
        "Small, dusty golden-brown pustules on both upper and lower leaf surfaces.",
        "Leaves turning yellow and drying up prematurely under severe infection.",
        "Powdery red-orange rust spores rub off easily on fingers."
      ],
      causes: [
        "Fungal spores (Puccinia sorghi) carried over long distances by wind.",
        "Extended periods of cool, high-moisture weather (16-23°C) and high dew."
      ],
      treatment: [
        "Apply copper-based or mancozeb fungicides early at the first appearance of pustules.",
        "Spray organic neem oil extract directly on affected leaves to slow down spore germination."
      ],
      prevention: [
        "Plant certified rust-resistant maize seed hybrids.",
        "Ensure wide crop spacing to promote leaf ventilation and rapid drying.",
        "Practice crop rotation with non-cereal crops like beans or alfalfa."
      ],
      swahili: {
        diseaseName: "Kutu ya Kawaida (Common Rust)",
        severity: "Kati",
        symptoms: [
          "Madoa madogo ya rangi ya dhahabu na kahawia juu na chini ya jani yanayotokeza vumbi.",
          "Majani yanabadilika rangi kuwa ya manjano na kukauka kabla ya wakati maambukizi yakiwa makubwa.",
          "Vumbi jekundu-machungwa la spora ambalo linafutika kwa urahisi ukigusa kwa vidole."
        ],
        causes: [
          "Spora za kuvu (Puccinia sorghi) zinazosafirishwa kwa umbali mrefu na upepo.",
          "Vipindi virefu vya hali ya hewa yenye baridi, unyevu mwingi (nyuzijoto 16-23°C) na umande."
        ],
        treatment: [
          "Nyunyizia dawa za kuua kuvu zenye shaba au mancozeb mapema pustoli zinapoanza kuonekana.",
          "Nyunyizia mafuta ya mwarobaini (neem oil) moja kwa moja kwenye majani yaliyoathirika ili kuzuia ukuaji wa spora."
        ],
        prevention: [
          "Panda mbegu chotara za mahindi zilizothibitishwa kuhimili ugonjwa wa kutu.",
          "Hakikisha nafasi ya kutosha kati ya mimea ili kuruhusu uingizaji hewa na kukausha majani haraka.",
          "Fanya mzunguko wa mazao na mazao yasiyo ya nafaka kama vile maharagwe."
        ]
      }
    },
    {
      diseaseName: "Northern Corn Leaf Blight",
      confidence: 88,
      severity: "High",
      symptoms: [
        "Long, elliptical, grayish-green or tan lesions on leaves, resembling cigar shapes.",
        "Lesions starting on lower leaves and rapidly progressing upward.",
        "Dark, dusty fungal growth appearing inside the gray lesions during wet weather."
      ],
      causes: [
        "Fungus (Exserohilum turcicum) overwintering in old crop residues.",
        "Warm, humid conditions (18-27°C) accompanied by frequent rains or heavy dews."
      ],
      treatment: [
        "Apply systemic triazole or strobilurin fungicides for critical outbreaks.",
        "Prune and safely burn heavily diseased lower leaves to limit upward spread."
      ],
      prevention: [
        "Plant blight-resistant seed varieties.",
        "Till old crop residues deep into the soil after harvest to suppress fungus survival.",
        "Rotate crops with beans or potatoes for at least two seasons."
      ],
      swahili: {
        diseaseName: "Kunyauka kwa Majani ya Mahindi ya Kaskazini",
        severity: "Juu",
        symptoms: [
          "Madoa marefu, ya mviringo, yenye rangi ya kijivu-kijani au hudhurungi kwenye majani yanayofanana na umbo la sigara.",
          "Madoa yanayoanzia kwenye majani ya chini na kuenea haraka kwenda juu.",
          "Utando mweusi wa kuvu unaoonekana ndani ya madoa ya kijivu wakati wa hali ya hewa ya mvua."
        ],
        causes: [
          "Kuvu (Exserohilum turcicum) inayoishi kwenye mabaki ya zamani ya mazao.",
          "Hali ya hewa ya joto na unyevu (nyuzijoto 18-27°C) ikiambatana na mvua za mara kwa mara au umande mzito."
        ],
        treatment: [
          "Nyunyizia dawa za kuua kuvu za kimfumo (systemic fungicides) kama triazole au strobilurin.",
          "Kata na uchome moto majani ya chini yaliyoathirika sana ili kuzuia maambukizi kuenea juu."
        ],
        prevention: [
          "Panda aina za mbegu zinazostahimili ugonjwa wa blight.",
          "Limia mabaki ya mazao ya zamani chini kabisa ya udongo baada ya kuvuna ili kuzuia kuvu kuishi.",
          "Badilisha mazao kwa kupanda maharagwe au viazi kwa angalau misimu miwili."
        ]
      }
    }
  ],
  Potato: [
    {
      diseaseName: "Late Blight",
      confidence: 96,
      severity: "High",
      symptoms: [
        "Dark, water-soaked, irregular spots on leaves that expand rapidly.",
        "A delicate white powdery mold layer on the margins of spots on the leaf underside.",
        "Rotting stems turning black and tuber decay emitting a strong, foul odor."
      ],
      causes: [
        "Oomycete pathogen (Phytophthora infestans) that thrives in wet, cool microclimates.",
        "High relative humidity (>90%) and mild temperatures (15-20°C)."
      ],
      treatment: [
        "Immediate application of protectant fungicides like metalaxyl or chlorothalonil.",
        "Immediately destroy and bury infected potato tubers and plants to prevent wind-borne spread."
      ],
      prevention: [
        "Use certified disease-free seed tubers.",
        "Avoid overhead irrigation; use drip lines to keep leaf surfaces dry.",
        "Ensure hilling of soil over potato tubers to shield them from washing spores."
      ],
      swahili: {
        diseaseName: "Baka Chelewa la Viazi (Late Blight)",
        severity: "Juu",
        symptoms: [
          "Madoa meusi, ya mviringo na yaliyolowa maji kwenye majani yanayoongezeka ukubwa haraka.",
          "Ukungu mweupe, laini kwenye kingo za madoa chini ya jani.",
          "Shina linalooza na kugeuka rangi kuwa nyeusi, na viazi vyenyewe kuoza na kutoa harufu mbaya sana."
        ],
        causes: [
          "Pathojeni ya kuvu (Phytophthora infestans) inayostawi katika hali ya hewa yenye unyevu na baridi.",
          "Unyevu wa juu sana (>90%) na nyuzijoto za wastani (15-20°C)."
        ],
        treatment: [
          "Nyunyizia haraka dawa za kuzuia kuvu kama metalaxyl au chlorothalonil.",
          "Haribu na uzike mara moja mimea na viazi vilivyoambukizwa ili kuzuia spora kusambazwa na upepo."
        ],
        prevention: [
          "Tumia mbegu za viazi zilizothibitishwa kutokuwa na ugonjwa.",
          "Epuka kumwagilia maji juu ya majani; tumia mfumo wa drip kuweka majani makavu.",
          "Inua udongo wa kutosha kuzunguka shina la viazi ili kulinda viazi vilivyo chini visifikiwe na spora."
        ]
      }
    },
    {
      diseaseName: "Early Blight",
      confidence: 91,
      severity: "Medium",
      symptoms: [
        "Small, dark, circular spots on older leaves first, featuring concentric ring patterns like a target.",
        "Leaves turning yellow, drying up, and dropping off as spots enlarge.",
        "Dry, leathery, dark brown sunken spots forming on potato skin."
      ],
      causes: [
        "Fungal pathogen (Alternaria solani) that attacks stressed or mature leaves.",
        "Alternating wet and dry weather conditions."
      ],
      treatment: [
        "Apply copper-based organic fungicides or chemical dithiocarbamates.",
        "Increase nitrogen fertilizer feeds to promote healthy vegetative growth and delay maturity."
      ],
      prevention: [
        "Harvest and clean out all crop debris to prevent spore nesting in winter.",
        "Practice strict crop rotation with non-solanaceous crops (avoid tomatoes/peppers).",
        "Water crops at the base early in the day so foliage dries quickly."
      ],
      swahili: {
        diseaseName: "Baka Tangulia la Viazi (Early Blight)",
        severity: "Kati",
        symptoms: [
          "Madoa madogo, meusi yenye duara kwenye majani ya zamani kwanza, yakiwa na mistari ya mviringo ndani yake.",
          "Majani yanageuka manjano, kukauka, na kudondoka kadri madoa yanavyoongezeka.",
          "Madoa makavu ya kahawia na yaliyobonyea yanatokea kwenye ngozi ya kiazi."
        ],
        causes: [
          "Pathojeni ya kuvu (Alternaria solani) inayoshambulia majani yaliyozeeka au yaliyodhoofika.",
          "Hali ya hewa inayobadilika-badilika kati ya ukavu na unyevu."
        ],
        treatment: [
          "Tumia dawa za kuua kuvu za kikaboni zenye shaba au dithiocarbamates za kemikali.",
          "Ongeza mbolea ya nitrojeni ili kukuza majani mapya na yenye nguvu, hivyo kuchelewesha kuzeeka kwa mmea."
        ],
        prevention: [
          "Kusanya na kusafisha mabaki yote ya mazao baada ya kuvuna ili kuzuia spora kubaki shambani.",
          "Fanya mzunguko mkali wa mazao na mimea isiyo ya jamii ya viazi/nyanya.",
          "Nyunyizia maji kwenye shina asubuhi na mapema ili majani yakauke haraka."
        ]
      }
    }
  ],
  Tomato: [
    {
      diseaseName: "Late Blight",
      confidence: 97,
      severity: "High",
      symptoms: [
        "Irregular, dark, greasy-looking spots on leaves and green tomato fruits.",
        "White velvety fungal growth on the underside of leaves during damp conditions.",
        "Complete plant collapse and rotting of tomatoes within days if untreated."
      ],
      causes: [
        "Airborne spores of Phytophthora infestans.",
        "Extended wet conditions with temperatures between 15-22°C."
      ],
      treatment: [
        "Spray systemic fungicides immediately; organic copper soaps offer partial control.",
        "Prune and destroy infected stems. Do not compost diseased tomato foliage."
      ],
      prevention: [
        "Maintain high tomato support stakes to prevent leaves touching wet soil.",
        "Mulch the soil surface around plants to prevent soil spores from splashing up.",
        "Always irrigate roots directly, avoiding wet leaves."
      ],
      swahili: {
        diseaseName: "Baka Chelewa la Nyanya",
        severity: "Juu",
        symptoms: [
          "Madoa yasiyo na vipimo maalum, meusi yenye mafuta kwenye majani na nyanya mbichi.",
          "Utando mweupe kama sufu chini ya majani wakati wa hali ya hewa yenye unyevunyevu.",
          "Mmea wote unaweza kunyauka na kuoza ndani ya siku chache usipotibiwa."
        ],
        causes: [
          "Spora zinazosafirishwa na upepo za Phytophthora infestans.",
          "Hali ya hewa ya mvua ya muda mrefu yenye nyuzijoto kati ya 15-22°C."
        ],
        treatment: [
          "Nyunyizia dawa za kimfumo za kuua kuvu mara moja; sabuni za shaba za kikaboni husaidia kiasi.",
          "Kata na haribu matawi yaliyoambukizwa. Usiweke majani yenye ugonjwa kwenye mboji."
        ],
        prevention: [
          "Weka vigingi vya juu kusaidia nyanya ili kuzuia majani kugusa udongo uliolowa.",
          "Weka matandazo (mulch) kwenye udongo ili kuzuia spora kurukia majani wakati wa mvua.",
          "Daima mwagilia maji kwenye mizizi moja kwa moja, epuka kulowesha majani."
        ]
      }
    },
    {
      diseaseName: "Early Blight",
      confidence: 92,
      severity: "Medium",
      symptoms: [
        "Target-like dark brown circular spots appearing on older lower tomato leaves.",
        "Leathery dark spots forming near the stem end of ripe tomatoes.",
        "Yellow halos developing around leaf spots, leading to leaves falling off."
      ],
      causes: [
        "Alternaria solani spores splashing from soil residues during rains.",
        "High humidity and warm temperatures (24-29°C)."
      ],
      treatment: [
        "Apply copper, chlorothalonil, or mancozeb sprays at 7-10 day intervals.",
        "Remove the lower branches (bottom 30 cm) of the plant to minimize contact with soil pathogens."
      ],
      prevention: [
        "Rotate tomatoes with crops like onions, carrots, or beans.",
        "Provide rich compost and mulch to block soil-to-leaf spore splashing.",
        "Ensure wide spacing (at least 60 cm) between tomato plants."
      ],
      swahili: {
        diseaseName: "Baka Tangulia la Nyanya",
        severity: "Kati",
        symptoms: [
          "Madoa ya kahawia yenye duara kama shabaha yanayotokea kwenye majani ya chini yaliyozeeka.",
          "Madoa makavu na magumu ya kahawia karibu na kikonyo cha nyanya iliyoiva.",
          "Rangi ya manjano kuzunguka madoa ya jani, inayopelekea majani hayo kupukutika."
        ],
        causes: [
          "Spora za Alternaria solani zinazoruka kutoka kwenye mabaki ya udongo wakati wa mvua.",
          "Unyevu mwingi wa hewa na hali ya hewa ya joto (nyuzijoto 24-29°C)."
        ],
        treatment: [
          "Nyunyizia dawa za shaba, chlorothalonil, au mancozeb kila baada ya siku 7-10.",
          "Ondoa matawi yote ya chini ya mmea (sentimita 30 za chini) ili kupunguza kugusa udongo wenye pathojeni."
        ],
        prevention: [
          "Badilisha nyanya na mazao kama vitunguu, karoti, au maharagwe.",
          "Weka mboji na matandazo ya kutosha ili kuzuia spora kuruka kutoka kwenye udongo kwenda kwenye majani.",
          "Hakikisha nafasi kubwa (angalau sentimita 60) kati ya mimea ya nyanya."
        ]
      }
    }
  ],
  Wheat: [
    {
      diseaseName: "Leaf Rust",
      confidence: 90,
      severity: "High",
      symptoms: [
        "Tiny, oval, orange-brown powdery pustules scattered randomly across leaf blades.",
        "Pustules rupturing the leaf skin, exposing masses of dusty orange spores.",
        "Heavily rusted leaves turning brown and drying, reducing crop yield severely."
      ],
      causes: [
        "Fungus (Puccinia triticina) which requires leaf moisture to germinate.",
        "Mild temperatures (15-22°C) combined with overnight dew or high humidity."
      ],
      treatment: [
        "Apply systemic strobilurin or triazole fungicides at the flag leaf stage.",
        "Use potassium-rich fertilizers to strengthen cellular walls and resist spore entry."
      ],
      prevention: [
        "Sow certified rust-resistant wheat varieties.",
        "Destroy any wild grass weeds or volunteers near the wheat field that host the fungus.",
        "Sow crops early in the season to escape peak spore periods."
      ],
      swahili: {
        diseaseName: "Kutu ya Majani ya Ngano (Leaf Rust)",
        severity: "Juu",
        symptoms: [
          "Vipustoli vidogo vya mviringo vyenye vumbi la machungwa na kahawia vilivyotawanyika kwenye majani.",
          "Vipustoli vinavyopasua ngozi ya jani na kutoa vumbi la spora za machungwa.",
          "Majani yaliyoathiriwa sana hugeuka rangi kuwa kahawia na kukauka, hivyo kupunguza mavuno sana."
        ],
        causes: [
          "Kuvu (Puccinia triticina) inayohitaji unyevu kwenye jani ili kuota.",
          "Joto la wastani (nyuzijoto 15-22°C) likiambatana na umande wa usiku au unyevu mwingi."
        ],
        treatment: [
          "Nyunyizia dawa za kimfumo za kuua kuvu kama strobilurin au triazole wakati ngano inapotoa jani la mwisho (flag leaf).",
          "Weka mbolea yenye potasiamu ili kuimarisha kuta za seli za mmea ili kuzuia spora kupenya."
        ],
        prevention: [
          "Panda aina za ngano zilizothibitishwa kuhimili ugonjwa wa kutu.",
          "Haribu magugu ya nyasi pori karibu na shamba la ngano ambayo yanaweza kubeba kuvu hiyo.",
          "Panda ngano mapema mwanzoni mwa msimu ili kukwepa vipindi vya spora nyingi upeponi."
        ]
      }
    }
  ],
  Beans: [
    {
      diseaseName: "Anthracnose",
      confidence: 93,
      severity: "High",
      symptoms: [
        "Dark reddish-brown to black sunken lesions along leaf veins on the underside.",
        "Circular sunken black spots with reddish borders developing on bean pods.",
        "Pod lesions developing pinkish slimy masses of spores in wet weather."
      ],
      causes: [
        "Seed-borne fungus (Colletotrichum lindemuthianum) that stays inside seeds.",
        "Cool, rainy, wet weather coupled with brushing against wet plants."
      ],
      treatment: [
        "Apply thiophanate-methyl, mancozeb, or copper sprays as soon as lesions appear.",
        "Avoid working or walking through bean rows while leaves are wet to prevent spreading spores."
      ],
      prevention: [
        "Plant only certified disease-free bean seeds. Never save seeds from infected pods.",
        "Practice a minimum 2-year crop rotation without legumes.",
        "Plough under all bean straw deep into the soil after harvest."
      ],
      swahili: {
        diseaseName: "Chule / Anthracnose la Maharagwe",
        severity: "Juu",
        symptoms: [
          "Madoa yaliyobonyea ya kahawia-nyekundu hadi meusi kando ya mishipa ya jani chini ya jani.",
          "Madoa ya mviringo yaliyobonyea meusi yenye kingo nyekundu kwenye maganda ya maharagwe.",
          "Madoa ya maganda yanatokeza ute wa pinki wenye spora nyingi wakati wa hali ya hewa ya mvua."
        ],
        causes: [
          "Kuvu inayoishi ndani ya mbegu (Colletotrichum lindemuthianum).",
          "Hali ya hewa ya baridi, mvua, na unyevu ikiambatana na kugusana kwa mimea iliyolowa."
        ],
        treatment: [
          "Nyunyizia dawa za kuua kuvu kama thiophanate-methyl, mancozeb, au dawa zenye shaba mara tu madoa yanapoonekana.",
          "Epuka kufanya kazi au kutembea katikati ya mistari ya maharagwe wakati majani yakiwa makuu ili kuzuia kueneza spora."
        ],
        prevention: [
          "Panda mbegu zilizothibitishwa pekee. Usihifadhi mbegu kutoka kwenye mimea iliyoathirika.",
          "Fanya mzunguko wa mazao kwa angalau miaka 2 bila kupanda jamii ya kunde.",
          "Limia chini kabisa majani na mabaki ya maharagwe baada ya kuvuna."
        ]
      }
    }
  ]
};
