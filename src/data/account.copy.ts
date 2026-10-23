import type { CaseStatus, Locale } from "@/lib/types";

export type AccountCopy = {
  signInTitle: string; signInSub: string; registerTitle: string; registerSub: string;
  name: string; email: string; password: string; passwordHint: string;
  signIn: string; signingIn: string; createAccount: string; creating: string;
  noAccount: string; createOne: string; haveAccount: string; signInInstead: string;
  networkError: string; staffNote: string;
  hello: string; yourPatientId: string; patientIdHint: string; copy: string; copied: string;
  startVisit: string; previousVisits: string; noVisits: string;
  visitId: string; viewVisit: string; back: string; submitted: string; signOut: string; urgent: string;
  viewMyVisits: string;
  status: Record<CaseStatus, string>;
};

export const accountCopy: Record<Locale, AccountCopy> = {
  en: {
    signInTitle: "Sign in",
    signInSub: "Welcome back. Sign in to see your visits and start a new one.",
    registerTitle: "Create your account",
    registerSub: "Register once. You get a permanent patient ID, and every visit is saved to your account.",
    name: "Full name", email: "Email", password: "Password", passwordHint: "At least 8 characters",
    signIn: "Sign in", signingIn: "Signing in…", createAccount: "Create account", creating: "Creating account…",
    noAccount: "New here?", createOne: "Create an account", haveAccount: "Already registered?", signInInstead: "Sign in",
    networkError: "Couldn't reach the server. Check your connection.",
    staffNote: "Doctors and admins sign in here too.",
    hello: "Hello", yourPatientId: "Your patient ID",
    patientIdHint: "Staff open your records with this ID. It never changes.",
    copy: "Copy", copied: "Copied",
    startVisit: "Start a new visit", previousVisits: "Your previous visits",
    noVisits: "No visits yet. Start one when you arrive at the clinic.",
    visitId: "Case ID", viewVisit: "View", back: "← All my visits", submitted: "Submitted", signOut: "Sign out", urgent: "Urgent",
    viewMyVisits: "View my visits",
    status: { new: "Waiting", in_consultation: "With the doctor", completed: "Completed" },
  },
  hi: {
    signInTitle: "साइन इन करें",
    signInSub: "वापसी पर स्वागत है। अपनी पिछली विज़िट देखने या नई शुरू करने के लिए साइन इन करें।",
    registerTitle: "अपना खाता बनाएँ",
    registerSub: "एक बार रजिस्टर करें। आपको स्थायी मरीज़ आईडी मिलेगी और हर विज़िट आपके खाते में सेव होगी।",
    name: "पूरा नाम", email: "ईमेल", password: "पासवर्ड", passwordHint: "कम से कम 8 अक्षर",
    signIn: "साइन इन", signingIn: "साइन इन हो रहा है…", createAccount: "खाता बनाएँ", creating: "खाता बन रहा है…",
    noAccount: "नए हैं?", createOne: "खाता बनाएँ", haveAccount: "पहले से रजिस्टर हैं?", signInInstead: "साइन इन करें",
    networkError: "सर्वर तक नहीं पहुँच सके। कनेक्शन जाँचें।",
    staffNote: "डॉक्टर और एडमिन भी यहीं से साइन इन करते हैं।",
    hello: "नमस्ते", yourPatientId: "आपकी मरीज़ आईडी",
    patientIdHint: "स्टाफ़ इसी आईडी से आपका रिकॉर्ड खोलता है। यह कभी नहीं बदलती।",
    copy: "कॉपी करें", copied: "कॉपी हो गया",
    startVisit: "नई विज़िट शुरू करें", previousVisits: "आपकी पिछली विज़िट",
    noVisits: "अभी कोई विज़िट नहीं। क्लिनिक पहुँचकर शुरू करें।",
    visitId: "केस आईडी", viewVisit: "देखें", back: "← मेरी सभी विज़िट", submitted: "जमा किया गया", signOut: "साइन आउट", urgent: "ज़रूरी",
    viewMyVisits: "मेरी विज़िट देखें",
    status: { new: "इंतज़ार में", in_consultation: "डॉक्टर के पास", completed: "पूरी हुई" },
  },
  mr: {
    signInTitle: "साइन इन करा",
    signInSub: "पुन्हा स्वागत. तुमच्या मागील भेटी पाहण्यासाठी किंवा नवीन सुरू करण्यासाठी साइन इन करा.",
    registerTitle: "तुमचे खाते तयार करा",
    registerSub: "एकदा नोंदणी करा. तुम्हाला कायमचा रुग्ण आयडी मिळेल आणि प्रत्येक भेट तुमच्या खात्यात सेव्ह होईल.",
    name: "पूर्ण नाव", email: "ईमेल", password: "पासवर्ड", passwordHint: "किमान 8 अक्षरे",
    signIn: "साइन इन", signingIn: "साइन इन होत आहे…", createAccount: "खाते तयार करा", creating: "खाते तयार होत आहे…",
    noAccount: "नवीन आहात?", createOne: "खाते तयार करा", haveAccount: "आधीच नोंदणी केली आहे?", signInInstead: "साइन इन करा",
    networkError: "सर्व्हरशी संपर्क होऊ शकला नाही. कनेक्शन तपासा.",
    staffNote: "डॉक्टर आणि अ‍ॅडमिनसुद्धा येथूनच साइन इन करतात.",
    hello: "नमस्कार", yourPatientId: "तुमचा रुग्ण आयडी",
    patientIdHint: "कर्मचारी याच आयडीने तुमचे रेकॉर्ड उघडतात. तो कधीही बदलत नाही.",
    copy: "कॉपी करा", copied: "कॉपी झाले",
    startVisit: "नवीन भेट सुरू करा", previousVisits: "तुमच्या मागील भेटी",
    noVisits: "अजून एकही भेट नाही. क्लिनिकमध्ये आल्यावर सुरू करा.",
    visitId: "केस आयडी", viewVisit: "पहा", back: "← माझ्या सर्व भेटी", submitted: "सादर केले", signOut: "साइन आउट", urgent: "तातडीचे",
    viewMyVisits: "माझ्या भेटी पहा",
    status: { new: "प्रतीक्षेत", in_consultation: "डॉक्टरांकडे", completed: "पूर्ण" },
  },
};
