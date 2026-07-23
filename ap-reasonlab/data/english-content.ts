export type EnglishPracticeQuestion = {
  id: string;
  skill: string;
  prompt: string;
  choices: string[];
  answer: number;
  explanation: string;
};

export const englishAreas = [
  { href: "/english/toefl", title: "TOEFL", icon: "T", description: "2026 iBT skills, academic English, original mini practice, and official ETS resources." },
  { href: "/english/ielts", title: "IELTS", icon: "I", description: "Academic Listening, Reading, Writing, and Speaking with task planning." },
  { href: "/english/sat", title: "SAT", icon: "S", description: "Digital SAT Reading & Writing domains, grammar, rhetoric, and short passages." },
  { href: "/english/vocabulary", title: "Vocabulary", icon: "V", description: "Academic word families, collocations, context, and active-recall study." },
  { href: "/english/grammar", title: "Grammar & Sentences", icon: "G", description: "Sentence boundaries, clauses, transitions, punctuation, and revision." },
  { href: "/english/writing", title: "Writing", icon: "W", description: "Paragraph logic, evidence, academic discussion, email, and essay revision." },
  { href: "/english/ai", title: "English AI Tutor", icon: "AI", description: "A focused AI for English learning, writing feedback, vocabulary, and test strategy." },
] as const;

export const academicVocabulary = [
  { word: "analyze", family: "analysis · analytical", meaning: "examine parts and relationships", collocation: "analyze evidence", example: "The report analyzes how rainfall affects crop yield." },
  { word: "infer", family: "inference · inferential", meaning: "reach a conclusion from evidence", collocation: "infer from context", example: "From the empty nests, researchers inferred that the birds had migrated." },
  { word: "substantiate", family: "substantiation", meaning: "support a claim with evidence", collocation: "substantiate a claim", example: "One observation cannot substantiate a broad conclusion." },
  { word: "concede", family: "concession", meaning: "acknowledge that a point is valid", collocation: "concede a limitation", example: "The author concedes that the sample was small." },
  { word: "derive", family: "derivation · derivative", meaning: "obtain something from a source", collocation: "derive from", example: "The estimate was derived from three independent measurements." },
  { word: "coherent", family: "coherence · coherently", meaning: "logical and easy to follow", collocation: "coherent argument", example: "Clear transitions make the explanation more coherent." },
  { word: "ambiguous", family: "ambiguity · ambiguously", meaning: "open to more than one interpretation", collocation: "ambiguous wording", example: "The pronoun is ambiguous because it could refer to either scientist." },
  { word: "prevalent", family: "prevalence", meaning: "common or widespread", collocation: "widely prevalent", example: "The practice became prevalent after production costs fell." },
  { word: "mitigate", family: "mitigation", meaning: "reduce the severity of something", collocation: "mitigate risk", example: "Backup sensors can mitigate the effect of a single failure." },
  { word: "corroborate", family: "corroboration", meaning: "confirm with additional evidence", collocation: "corroborate findings", example: "A second experiment corroborated the initial result." },
  { word: "plausible", family: "plausibility · plausibly", meaning: "reasonable and believable", collocation: "plausible explanation", example: "The hypothesis is plausible, but it still requires testing." },
  { word: "nevertheless", family: "contrast transition", meaning: "despite what was just stated", collocation: "nevertheless, the result…", example: "The trial was brief; nevertheless, it revealed a useful pattern." },
] as const;

export const sentencePatterns = [
  { title: "Claim → reason", pattern: "[Claim] because [specific reason].", example: "The second design is more reliable because it continues operating after one sensor fails." },
  { title: "Concession → position", pattern: "Although [valid limitation], [main position].", example: "Although the sample is small, the repeated pattern deserves further study." },
  { title: "Evidence → inference", pattern: "Because [evidence], it is reasonable to infer that [careful conclusion].", example: "Because both trials produced similar curves, it is reasonable to infer that the trend is reproducible." },
  { title: "Contrast", pattern: "Whereas [A], [B].", example: "Whereas the first passage emphasizes cost, the second focuses on reliability." },
  { title: "Definition with precision", pattern: "[Term] refers to [category] that [distinguishing feature].", example: "A feedback loop refers to a process in which an output influences a later input." },
  { title: "Cautious academic claim", pattern: "The evidence suggests that [claim], although [uncertainty].", example: "The evidence suggests that sleep improved recall, although the study did not control diet." },
] as const;

export const toeflQuestions: EnglishPracticeQuestion[] = [
  { id: "toefl-1", skill: "Complete the Words", prompt: "The new evidence did not con___dict the earlier finding; instead, it strengthened it.", choices: ["tra", "tro", "tre", "tru"], answer: 0, explanation: "The complete word is contradict. The sentence says the evidence did the opposite: it strengthened the finding." },
  { id: "toefl-2", skill: "Academic Reading", prompt: "A campus replaced fixed lighting schedules with motion sensors. Energy use fell, but students reported that some hallways became dark too quickly. Which conclusion is best supported?", choices: ["Motion sensors always improve campus safety.", "The system saved energy but may need timing adjustments.", "Students preferred the old system in every building.", "Lighting had no measurable effect on energy use."], answer: 1, explanation: "The passage supports both the energy benefit and a specific usability problem; it does not support absolute claims." },
  { id: "toefl-3", skill: "Academic Discussion", prompt: "A class is discussing whether universities should record every lecture. Which response has the clearest position and support?", choices: ["Yes. Recordings are good.", "It depends, and many things matter.", "Universities should record lectures because students can review complex explanations; however, instructors should control access to protect class discussion.", "Lectures have existed for a long time."], answer: 2, explanation: "This response states a position, gives a relevant reason, and addresses a reasonable limitation." },
];

export const ieltsQuestions: EnglishPracticeQuestion[] = [
  { id: "ielts-1", skill: "Reading · writer's view", prompt: "A researcher writes: ‘Urban gardens cannot replace regional farms, but their educational value is often underestimated.’ What is the writer's view?", choices: ["Urban gardens should replace farms.", "Urban gardens have no practical value.", "Their educational benefit deserves more recognition.", "Regional farms are mainly educational."], answer: 2, explanation: "The contrast after ‘but’ introduces the writer's main emphasis." },
  { id: "ielts-2", skill: "Writing Task 1", prompt: "A graph rises from 40 to 75, remains near 75, then falls to 60. Which overview is strongest?", choices: ["The graph has many numbers.", "Overall, the value rose sharply, levelled off, and then declined moderately while remaining above its starting point.", "First it was 40, then 75, then 75, then 60.", "The graph is interesting and important."], answer: 1, explanation: "A Task 1 overview should summarize the main trend and major stages rather than list every point." },
  { id: "ielts-3", skill: "Speaking · development", prompt: "For a question about a useful technology, which answer plan is easiest to develop?", choices: ["Name only", "Name → how you use it → concrete example → why it matters", "Definition from a dictionary", "Several unrelated technologies"], answer: 1, explanation: "A clear sequence helps you extend the response naturally and provide specific language." },
];

export const satQuestions: EnglishPracticeQuestion[] = [
  { id: "sat-1", skill: "Standard English Conventions", prompt: "The prototype completed twelve trials ___ only two required a manual reset.", choices: [", and", ",", "; and", ": and"], answer: 0, explanation: "Two independent clauses can be joined with a comma plus the coordinating conjunction ‘and’." },
  { id: "sat-2", skill: "Transitions", prompt: "The first model was faster. ___, the second model produced more consistent measurements.", choices: ["For example", "Similarly", "However", "Therefore"], answer: 2, explanation: "The second sentence contrasts speed with consistency, so ‘However’ fits." },
  { id: "sat-3", skill: "Information and Ideas", prompt: "After a library extended weekend hours, attendance rose by 18%, while weekday attendance remained nearly unchanged. Which claim is best supported?", choices: ["The library became more popular every day.", "Longer weekend access was associated with higher weekend attendance.", "Weekday hours should be reduced.", "Most visitors attended only on weekends."], answer: 1, explanation: "This choice stays within the data and avoids unsupported causal or absolute claims." },
  { id: "sat-4", skill: "Expression of Ideas", prompt: "A student wants to emphasize a study's limitation. Which sentence best accomplishes the goal?", choices: ["The result was interesting.", "The experiment used sensors.", "Because the study observed only one school, its findings may not apply to schools with different schedules.", "The researchers created a chart."], answer: 2, explanation: "It identifies the limitation and explains how it restricts the conclusion." },
];

