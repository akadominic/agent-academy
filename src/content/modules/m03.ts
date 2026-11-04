import type { Lesson } from "../schema";

/* ======================================================================
   MODULE 3 — How Large Language Models Work
   Four lessons: from AI to LLMs · tokens & next-token prediction ·
   attention & the context window · what models cannot do alone.
   ====================================================================== */

/* ---------------------------------------------------------------------- */
/*  m3-l1  From AI to LLMs                                                  */
/* ---------------------------------------------------------------------- */

const l1: Lesson = {
  id: "m3-l1",
  moduleId: "m3",
  title: "From AI to LLMs",
  subtitle: "AI, machine learning, deep learning and generative AI, and the difference between training a model and using it.",
  minutes: 35,
  prerequisites: ["m0-l1"],
  objectives: [
    "Place AI, machine learning, deep learning, generative AI and LLMs inside one another correctly.",
    "Explain the difference between a rule a programmer writes and a pattern a model learns from examples.",
    "Describe a neural network as layers of adjustable numbers (**weights**) that training tunes.",
    "Tell **training** (done once, very expensive, by the model maker) apart from **inference** (every time you use the model).",
  ],
  glossary: ["ai", "machine-learning", "deep-learning", "neural-network", "parameters", "training", "inference", "generative-ai", "llm", "knowledge-cutoff"],
  completion: [
    "Train the toy model on every sentence, then use it to generate a sentence.",
    "Pass the knowledge check (you can retry).",
    "Explain training and inference in your own words.",
  ],
  tutor: {
    simpler:
      "Nobody typed the answers into a language model. People showed it a huge amount of text, and a program slowly adjusted billions of numbers inside it until it became good at guessing the next piece of text. That adjusting is training. Afterwards the numbers are frozen, and every time you chat with it, it just uses them. That using is inference.",
    altAnalogy:
      "Learning to judge whether a jackfruit is ready: nobody gives you a written rule. You squeeze, smell and tap many jackfruits, someone tells you “ready” or “not yet”, and your judgement slowly adjusts. Later you just judge new ones quickly. The adjusting was training; judging a new one is inference. A neural network does something similar with numbers instead of experience, and without understanding what a jackfruit is.",
    misconceptions: [
      "“ChatGPT looks answers up in a big database of facts.” It does not store a list of answers. It holds numbers (weights) that make some continuations of text more likely than others.",
      "“When I correct it, it learns.” Using a model (inference) does not change its weights. A correction only lives in the current conversation.",
      "“AI and machine learning mean the same thing.” AI is the broad goal; machine learning is one way to reach it (learning from examples). Rule-based systems are also AI in the broad sense.",
      "“Neural networks work like a human brain.” The name comes from a loose inspiration. An artificial “neuron” is just multiply, add, and a simple function.",
    ],
    probingQuestions: [
      "In the toy model, what changed during training? What changed during inference?",
      "If a model finished training in January, how could it answer a question about a price that changed in March?",
      "In the mango example, why did the weight for colour end up close to zero?",
    ],
  },
  sections: [
    {
      kind: "problem",
      mode: "understand",
      title: "Too many ways to ask one question",
      blocks: [
        { type: "p", text: "In Module 0 you met System A, the rules program that only understood `ORDER rice 3`. Brian, Mama Achen's nephew, decides to improve it. He will write a rule for every way a customer might ask for the price of sugar." },
        { type: "list", items: [
          "“How much is sugar?”",
          "“sugar price pls”",
          "“Sukaali ssente mmeka?” (Luganda)",
          "“how much for 2kg sukaali”",
          "“Is sugar still 5,500 or it went up?”",
        ] },
        { type: "p", text: "By lunchtime he has forty rules and customers keep inventing new ways to ask. People mix English and Luganda, misspell words and use slang. **Nobody can write rules for every possible sentence.**" },
        { type: "callout", tone: "info", title: "The question for this lesson", text: "Instead of writing rules, could a computer **learn** patterns from thousands of examples? And what does it mean for a machine to “learn”?" },
      ],
    },
    {
      kind: "analogy",
      mode: "understand",
      title: "A new teacher learning to mark",
      blocks: [
        { type: "p", text: "A new teacher joins a school in Gulu and must mark mathematics scripts. The head of department does not hand over a perfect rule book. Instead she gives the new teacher a pile of scripts she has **already marked**." },
        { type: "steps", items: [
          { title: "Start with a rough marking guide.", text: "The new teacher guesses how much each thing is worth: correct final answer, working shown, units written." },
          { title: "Compare with the marked examples.", text: "On each script, the teacher's mark differs from the head of department's. Too high here, too low there." },
          { title: "Adjust the guide a little.", text: "“I am giving too much for the final answer and too little for the working.” Small adjustments, script after script, until the marks agree." },
          { title: "Then mark new scripts.", text: "With the finished guide the teacher can mark a brand-new script quickly, without the examples." },
        ] },
        { type: "analogyMap", title: "From the staff room to machine learning", pairs: [
          { everyday: "The pile of already-marked scripts", technical: "**Training data**: examples together with the right answers" },
          { everyday: "How much each part of the answer is worth", technical: "[[parameters|Weights]]: adjustable numbers inside the model" },
          { everyday: "Adjusting the guide when your mark disagrees", technical: "[[training|Training]]: nudging the weights to reduce the error" },
          { everyday: "A guide with stages, each feeding the next", technical: "Layers in a [[neural-network|neural network]] (many layers = [[deep-learning|deep learning]])" },
          { everyday: "Marking a new script with the finished guide", technical: "[[inference|Inference]]: using the trained model on new input" },
        ] },
        { type: "callout", tone: "warn", title: "Where the analogy breaks", text: "A teacher understands what “working shown” means. A neural network's weights are just numbers; no person chooses them, and nobody can read one weight and say what it means. A large language model has **billions** of them, adjusted automatically. It learns statistical patterns in text, which is not the same as understanding mathematics, or anything else, the way a person does." },
      ],
    },
    {
      kind: "visual",
      mode: "experiment",
      title: "Train a tiny model, then use it",
      blocks: [
        { type: "p", text: "Below is a very small language model. It starts **empty**. Press **Read next sentence** to train it on sentences about market life one at a time, and watch the counts for a word grow. When training is finished, switch to **Inference** and let it write a sentence." },
        { type: "lab", lab: "next-token", props: { scenario: "training" }, required: true, caption: "A toy model that learns by counting which word follows which. Training changes the counts; inference only reads them." },
        { type: "callout", tone: "sim", text: "This is a real, working program, but it is a **toy**. It learns by counting word pairs. A real large language model is a neural network with billions of weights, trained on a vast amount of text by adjusting those weights to reduce its prediction errors. The two things the toy shows truthfully are: (1) behaviour comes from **examples**, not hand-written rules; and (2) **training** and **using** are separate phases." },
      ],
    },
    {
      kind: "technical",
      mode: "understand",
      title: "The family tree, and how learning really works",
      blocks: [
        { type: "p", text: "These terms fit inside one another like boxes inside boxes:" },
        { type: "table", caption: "From the broadest idea to the most specific", head: ["Term", "What it means", "Example"], rows: [
          ["[[ai|Artificial intelligence]]", "The broad goal: computers doing tasks we associate with human judgement. Includes rule-based systems.", "An old chess program following hand-written strategies"],
          ["[[machine-learning|Machine learning]]", "AI that learns patterns from examples instead of following hand-written rules.", "A system that flags unusual mobile money transactions after learning from past fraud cases"],
          ["[[deep-learning|Deep learning]]", "Machine learning using [[neural-network|neural networks]] with many layers.", "An app that looks at a photo of a cassava leaf and flags possible disease"],
          ["[[generative-ai|Generative AI]]", "Models that produce new content: text, images, audio, code. Most modern ones use deep learning.", "A tool that draws a poster from a description"],
          ["[[llm|Large language model]]", "A generative model for text, trained on a huge amount of it to predict the next piece of text.", "The models behind ChatGPT, Claude and Gemini"],
        ] },
        { type: "p", text: "**A neural network** is a mathematical function built from many simple units. Each unit multiplies its inputs by weights, adds them up with an extra number called a bias, and passes the result through a simple function. Units are arranged in **layers**: the outputs of one layer are the inputs of the next. All the weights and biases together are the model's [[parameters|parameters]]. Many modern LLMs have billions of them. Some companies publish the number; others keep it secret." },
        { type: "p", text: "**Training** works like this. The weights start as random numbers. The model is shown an example and makes a prediction. The prediction is compared with the right answer to measure the error (called the **loss**). A mathematical method (gradient descent, using backpropagation) works out, for **every** weight, which direction would make the error slightly smaller, and nudges all of them a little. This repeats over an enormous number of examples." },
        { type: "p", text: "For an LLM, the main training task is simply: **given some text, predict the next token**. The internet, books and other text provide endless examples. A model trained only this way continues text; it is not yet a helpful assistant. Model makers then do further training (often called fine-tuning, frequently using feedback from people) so that it follows instructions and answers in a helpful way." },
        { type: "p", text: "**Inference** is using the finished model. The weights are frozen. Your input goes in, the numbers are applied, and an output comes out. Every chat message you send is inference. **Using a model does not change its weights.** (Some providers may use conversations to train future versions, depending on their policies and your settings. That is a separate training run, done later.)" },
        { type: "compare", left: { title: "Training", items: [
          "Done by the model maker, before release",
          "Changes the weights",
          "Needs enormous computing power; reported costs for large models run into many millions of US dollars",
          "Uses data up to a certain date (the [[knowledge-cutoff|knowledge cutoff]])",
        ] }, right: { title: "Inference", items: [
          "Done every time anyone uses the model",
          "Weights stay exactly the same",
          "Costs a small amount per request (you will see per-token pricing in Module 5)",
          "Sees only the model's weights plus the text you send now",
        ] } },
        { type: "callout", tone: "misconception", text: "“The model has a database of facts it looks things up in.” No. What it learned is spread across billions of weights as patterns. That is why it can write fluently about almost anything, and also why it can produce a confident sentence that is wrong. Lesson 4 returns to this." },
      ],
    },
    {
      kind: "example",
      mode: "understand",
      title: "Two real pieces of code that learn",
      blocks: [
        { type: "p", text: "**1. The toy model's training.** This is the actual function that ran in the lab above (from `src/labs/m03/ngram.ts`). “Training” here is just counting." },
        { type: "code", lang: "ts", code: `export function train(sentences: string[], order: 2 | 3): Counts {
  const counts: Counts = new Map();
  for (const sentence of sentences) {
    const words = [START, ...wordsOf(sentence)];
    if (order === 3) words.unshift(START);
    for (let i = order - 1; i < words.length; i++) {
      const key = contextKey(words.slice(0, i), order);
      const next = words[i];
      const row = counts.get(key) ?? new Map<string, number>();
      row.set(next, (row.get(next) ?? 0) + 1);
      counts.set(key, row);
    }
  }
  return counts;
}`, notes: [
          { line: 3, text: "Go through every training sentence." },
          { line: 4, text: "Add a special start marker, so the model can also learn how sentences begin." },
          { line: 7, text: "The context: the previous word (or two words)." },
          { line: 10, text: "Add one to the count for “this word followed that context”. This is the whole of the learning." },
        ] },
        { type: "p", text: "**2. One artificial neuron learning from examples.** This is real, runnable JavaScript. It learns to guess whether a mango is ripe from two measurements between 0 and 1: softness and yellowness. Nobody tells it which matters more; it adjusts its weights from four labelled examples." },
        { type: "code", lang: "js", code: `let weights = [0, 0];
let bias = 0;
const rate = 0.3;

function predict(x) {
  return weights[0] * x[0] + weights[1] * x[1] + bias;
}

function trainOn(x, target) {
  const error = target - predict(x);
  weights[0] += rate * error * x[0];
  weights[1] += rate * error * x[1];
  bias += rate * error;
}

const examples = [
  { x: [0.9, 0.8], target: 1 }, // soft and yellow: ripe
  { x: [0.2, 0.1], target: 0 }, // hard and green: not ripe
  { x: [0.8, 0.3], target: 1 }, // soft but greenish: ripe
  { x: [0.1, 0.7], target: 0 }, // yellowish but hard: not ripe
];

for (let round = 0; round < 200; round++) {
  for (const ex of examples) trainOn(ex.x, ex.target);
}
console.log(predict([0.85, 0.4]).toFixed(2)); // 1.04: ripe
console.log(predict([0.15, 0.6]).toFixed(2)); // 0.04: not ripe`, notes: [
          { line: 1, text: "The weights start at zero: the neuron knows nothing." },
          { line: 6, text: "A prediction is a weighted sum: multiply each input by its weight, add the bias." },
          { line: 10, text: "Error = the right answer minus the prediction." },
          { line: 11, text: "Nudge each weight in the direction that shrinks the error, in proportion to its input. This is the “adjust the marking guide” step." },
          { line: 23, text: "Training: 200 passes over the examples." },
          { line: 26, text: "Inference: a new mango it has never seen. After training, softness has a weight of about 1.42 and yellowness about −0.04. It discovered that, in these examples, colour does not predict ripeness." },
        ] },
        { type: "callout", tone: "info", text: "A real network uses the same idea (weighted sums and small adjustments to reduce error), but with billions of weights in many layers, and calculus to work out all the adjustments at once." },
      ],
    },
    {
      kind: "challenge",
      mode: "experiment",
      title: "Predict, train, then use",
      blocks: [
        { type: "p", text: "In the lab above, before training, choose the word **customer** in the counts panel and predict: after reading all sentences, which word will most often follow it? Then train and check." },
        { type: "p", text: "Next, try generating a sentence after reading only **three** sentences, and again after all of them. What changes? (Less training data means fewer patterns to draw on.)" },
        { type: "callout", tone: "tip", text: "The lab marks this challenge complete when you have trained on every sentence and then generated a complete sentence in the Inference view." },
        { type: "p", text: "**Optional: build for real.** Write the two core parts of a neuron yourself." },
        { type: "exercise", required: false, exercise: {
          id: "m3-l1-neuron",
          title: "A neuron's weighted sum and one learning step",
          brief: "Write `weightedSum(inputs, weights, bias)`, which multiplies each input by its weight, adds them up and adds the bias. Then write `adjust(weights, inputs, error, rate)`, which returns a NEW array where each weight has grown by `rate * error * input`.",
          starter: `function weightedSum(inputs, weights, bias) {
  // multiply each input by its weight, add them all, then add the bias
  return 0;
}

function adjust(weights, inputs, error, rate) {
  // return a new array: weights[i] + rate * error * inputs[i]
  return weights;
}
`,
          solution: `function weightedSum(inputs, weights, bias) {
  let total = bias;
  for (let i = 0; i < inputs.length; i++) {
    total += inputs[i] * weights[i];
  }
  return total;
}

function adjust(weights, inputs, error, rate) {
  return weights.map((w, i) => w + rate * error * inputs[i]);
}
`,
          tests: [
            { name: "weighted sum of two inputs plus bias", expr: "Math.round(weightedSum([1, 2], [0.5, 0.25], 0.1) * 1000) / 1000", expected: 1.1 },
            { name: "zero weights give just the bias", expr: "weightedSum([0.9, 0.8], [0, 0], 0.3)", expected: 0.3 },
            { name: "adjust nudges each weight by rate × error × input", expr: "adjust([0.5, 0.5], [1, 0], 0.2, 0.5).map((w) => Math.round(w * 1000) / 1000)", expected: [0.6, 0.5] },
            { name: "a negative error lowers the weights", expr: "adjust([1, 1], [1, 1], -1, 0.1).map((w) => Math.round(w * 1000) / 1000)", expected: [0.9, 0.9] },
          ],
          hints: [
            "For the sum, start a running total at `bias`, then loop over the inputs and add `inputs[i] * weights[i]`.",
            "For adjust, `weights.map((w, i) => ...)` gives you each weight and its position.",
            "A weight with input 0 does not change at all, because rate × error × 0 = 0.",
          ],
        } },
      ],
    },
    {
      kind: "failure",
      mode: "understand",
      title: "“But I told it yesterday!”",
      blocks: [
        { type: "p", text: "Mama Achen chats with an AI assistant: “My rice is UGX 110,000 a bag, remember that.” It replies, “Got it!” The next morning she opens a **new** chat and asks the price of her rice. It gives a different number, or says it does not know." },
        { type: "callout", tone: "warn", title: "How to recognise it", text: "Information given in one conversation is missing from another, or a correction does not “stick”." },
        { type: "p", text: "**Why:** chatting is inference. Her message never changed the model's weights. “Got it!” was simply a likely reply. The price only existed as text inside that one conversation. (Some chat apps have a separate “memory” feature that saves notes and re-sends them, but that is the app, not the model learning.)" },
        { type: "p", text: "**Fix:** send the information with every request that needs it, or better, let the software look it up from her records when needed. Lesson 3 covers the first idea; tools (Module 6) and memory (Module 8) cover the second." },
        { type: "p", text: "**A related failure: old knowledge.** Ask a model about this week's fuel price and it may answer from training data that ended months or years ago, at its [[knowledge-cutoff|knowledge cutoff]]. It may not warn you. Anything that changes over time must come from a current source." },
        { type: "p", text: "**And: uneven training data.** If a language like Runyankore appears much less often in the training data than English, the model's patterns for it are weaker. It may make more mistakes in that language. Test your system in the languages your users actually write." },
      ],
    },
    {
      kind: "quiz",
      mode: "understand",
      blocks: [
        { type: "quiz", questions: [
          {
            id: "q1", type: "order",
            prompt: "Put these from the **broadest** idea to the **most specific**.",
            items: ["Artificial intelligence", "Machine learning", "Deep learning", "Large language models"],
            hint: "Which one includes even hand-written rule systems? Which one is a specific kind of text model?",
            explanation: "AI is the broad goal. Machine learning is AI that learns from examples. Deep learning is machine learning with many-layered neural networks. LLMs are one kind of deep-learning model, for text.",
          },
          {
            id: "q2", type: "mcq", flavour: "predict",
            prompt: "Mama Achen tells a chatbot her new sugar price. Next week, in a **new** conversation, she asks it the price. What will most likely happen?",
            options: [
              { text: "It remembers, because it learned the price last week.", why: "Chatting is inference. The weights did not change, so nothing was learned." },
              { text: "It does not have her price: the new conversation does not contain it and the model's weights were never updated.", why: "Correct. The price only existed in last week's conversation text." },
              { text: "It looks the price up in its database of shop prices.", why: "A model has no database of facts, and certainly none of her private prices." },
            ],
            answer: 1,
            hint: "Does using a model change its weights?",
          },
          {
            id: "q3", type: "mcq", flavour: "analogy",
            prompt: "In the teacher-and-marking-guide analogy, what are the **weights**?",
            options: [
              { text: "The pile of already-marked scripts", why: "That is the training data: examples with the right answers." },
              { text: "How much each part of an answer is worth in the guide", why: "Yes. These are the adjustable numbers that training tunes." },
              { text: "Marking a brand-new script", why: "That is inference: using the finished guide." },
              { text: "The head of department", why: "She provides the correct answers (labels), not the adjustable numbers." },
            ],
            answer: 1,
            hint: "Which part of the story gets adjusted, a little at a time?",
          },
          {
            id: "q4", type: "multi", flavour: "recall",
            prompt: "Which of these happen during **training** (not during inference)? Select all that apply.",
            options: [
              { text: "Weights are nudged to reduce the error", why: "Yes. This is what training is." },
              { text: "The model's prediction is compared with the right answer", why: "Yes. Measuring the error (loss) tells training which way to adjust." },
              { text: "A customer gets a reply to their question", why: "That is inference: using the frozen model." },
              { text: "Huge amounts of computing power are used, usually once per model version", why: "Yes. Training large models is very expensive; inference costs a little per request." },
            ],
            answers: [0, 1, 3],
            hint: "Training changes the model. Inference uses it.",
          },
          {
            id: "q5", type: "mcq", flavour: "debug",
            prompt: "In the mango example, after training the weight for yellowness is about −0.04. What does that tell you?",
            options: [
              { text: "The code has a bug: weights should never be negative.", why: "Weights can be any number. Negative just means “this input pushes the prediction down a little”." },
              { text: "In these four examples, colour did not help predict ripeness, so training made its weight nearly zero.", why: "Correct. The neuron learned from the data that softness matters and colour barely does." },
              { text: "The neuron understands that green mangoes can be ripe.", why: "It understands nothing. It found a numerical pattern in four examples." },
            ],
            answer: 1,
            hint: "Look at the examples: was colour a reliable signal?",
          },
          {
            id: "q6", type: "short",
            prompt: "In one or two sentences: why is learning from examples better than writing rules for understanding customer messages?",
            modelAnswer: "People ask for the same thing in endless different ways, mixing languages and spellings, so nobody can write a rule for every sentence. A model trained on many examples picks up general patterns and can handle sentences nobody wrote a rule for.",
            checklist: ["Mentions that there are too many ways to say things for rules", "Mentions that learning from examples generalises to new sentences"],
          },
        ] },
      ],
    },
    {
      kind: "teachback",
      mode: "understand",
      blocks: [
        { type: "teachback",
          prompt: "Your younger brother asks: “Did someone type all the answers into ChatGPT?” Explain in your own words how a language model gets its abilities, and what happens when you chat with it.",
          rubric: [
            { concept: "It learned from examples, not typed-in answers or rules", keywords: ["example", "learn", "trained on", "text", "data", "pattern"], hint: "Where did its abilities come from, if not from typed answers?" },
            { concept: "Training adjusts numbers (weights) to reduce mistakes", keywords: ["weight", "number", "adjust", "parameter", "error", "mistake"], hint: "What exactly changes during training?" },
            { concept: "Using it (inference) does not change it", keywords: ["inference", "frozen", "doesn't change", "does not change", "not learn", "doesn't learn", "same"], hint: "Does chatting teach it anything?" },
            { concept: "It predicts text rather than looking up stored answers", keywords: ["predict", "next", "likely", "guess", "no database", "not a database"], hint: "How does it produce a reply?" },
          ],
          exemplar: "No. Nobody typed in answers. The model was shown a huge amount of text, and a training program kept adjusting billions of numbers inside it, called weights, so that it got better at predicting the next piece of text. When it was good enough the numbers were frozen. When you chat with it, that is called inference: it uses those frozen numbers to predict a likely reply, one piece at a time. Chatting does not teach it anything new, and it is not looking answers up in a database, which is why it can sound sure and still be wrong.",
        },
      ],
    },
    {
      kind: "recap",
      mode: "understand",
      blocks: [
        { type: "recap",
          summary: "**AI** is the broad goal; **machine learning** learns from examples; **deep learning** uses many-layered **neural networks**; **LLMs** are deep-learning models for text. A neural network is layers of weighted sums whose **weights** are adjusted during **training** to reduce errors. **Inference** uses the frozen weights and does not change them.",
          canNow: [
            "Explain how AI, machine learning, deep learning, generative AI and LLMs relate.",
            "Describe what a weight is and how training adjusts it.",
            "Explain why chatting with a model does not teach it anything.",
            "Explain why a model may not know about recent events.",
          ],
          next: "Next: what an LLM actually reads and writes. Text is cut into **tokens**, and the model writes one token at a time.",
        },
      ],
    },
  ],
};

/* ---------------------------------------------------------------------- */
/*  m3-l2  Tokens and next-token prediction                                 */
/* ---------------------------------------------------------------------- */

const l2: Lesson = {
  id: "m3-l2",
  moduleId: "m3",
  title: "Tokens and next-token prediction",
  subtitle: "How text becomes numbers, how a model writes one token at a time, and what temperature changes.",
  minutes: 40,
  prerequisites: ["m3-l1"],
  objectives: [
    "Explain what a token is and why token counts matter for cost, limits and speed.",
    "Recognise that tokenizers differ between models, and that languages such as Luganda often need more tokens per word than English.",
    "Describe the generation loop: predict a distribution, pick a token, add it, repeat.",
    "Explain what temperature and a seed do, and why the same prompt can give different answers.",
  ],
  glossary: ["token", "tokenization", "embedding", "next-token-prediction", "sampling", "temperature", "llm"],
  completion: [
    "Complete the tokenizer challenge: three predictions and a shorter prompt.",
    "Complete the temperature challenge in the next-token lab.",
    "Pass the knowledge check and submit your teach-back.",
  ],
  tutor: {
    simpler:
      "The model does not see letters or words. Text is chopped into pieces called tokens, and each piece becomes a number. The model looks at all the numbers so far and gives every possible next piece a chance (a probability). One piece is picked, added on, and it does the same again, piece after piece. Temperature controls how adventurous the picking is.",
    altAnalogy:
      "Predictive text on your phone keyboard suggests the next word after “Good”: maybe “morning”, “night” or “job”. An LLM does a similar job far better, using much more of the text so far. Temperature is like choosing whether to always tap the first suggestion (low) or sometimes tap the second or third (high).",
    misconceptions: [
      "“One token = one word.” Common English words are often one token, but many words split into several, and some languages split much more.",
      "“The model writes the whole answer at once.” It produces one token at a time; each new token is chosen after the earlier ones are fixed.",
      "“Temperature 0 means the answer is correct.” It only means the most likely token is picked each time. Likely is not the same as true.",
      "“Different answers mean the model is broken.” Variation is normal when sampling is used; you can reduce it, and you should validate outputs in code.",
    ],
    probingQuestions: [
      "Why would a Luganda message usually cost more than the same message in English?",
      "In the toy model, what happens to the bars when you move temperature from 1 to 0.3? From 1 to 2?",
      "If you need the model's answer to be exactly “yes” or “no”, which settings and checks would you use?",
    ],
    revisit: ["m3-l1"],
  },
  sections: [
    {
      kind: "problem",
      mode: "understand",
      title: "Same question, different answers, different bills",
      blocks: [
        { type: "p", text: "Brian has connected Mama Achen's WhatsApp to a language model. After a week he notices three puzzling things:" },
        { type: "list", ordered: true, items: [
          "The provider's bill is not counted in messages or words, but in **tokens**.",
          "Messages written in Luganda use noticeably **more** tokens than the same messages in English.",
          "When two customers send exactly the same question, the replies are sometimes **worded differently**.",
        ] },
        { type: "callout", tone: "info", title: "The question for this lesson", text: "What is a token, how does a model actually produce its reply, and why does the reply vary?" },
      ],
    },
    {
      kind: "analogy",
      mode: "understand",
      title: "Syllables and predictive text",
      blocks: [
        { type: "p", text: "Think of how a child learns to read in Primary One. Familiar words like “the” or “mama” are read at a glance, as one piece. A new, long word is sounded out in pieces: “ka-la-ma-zoo”. A **tokenizer** cuts text in a similar way: frequent pieces stay whole, rarer words are split into smaller chunks." },
        { type: "p", text: "Now think of predictive text on a phone keyboard. You type “Good” and it suggests “morning”, “night”, “job”. A language model does the same kind of job, predicting what comes next, but with a far larger model and far more of the earlier text taken into account." },
        { type: "analogyMap", title: "From the classroom and the keyboard to the model", pairs: [
          { everyday: "Reading a familiar word at a glance", technical: "A common word that is a single **token**" },
          { everyday: "Sounding out an unfamiliar word in syllables", technical: "A rare word split into several tokens by the [[tokenization|tokenizer]]" },
          { everyday: "The keyboard's three suggestions", technical: "A probability for **every** possible next token (a distribution)" },
          { everyday: "Always tapping the first suggestion, or sometimes the third", technical: "Low or high [[temperature|temperature]] during [[sampling|sampling]]" },
          { everyday: "Typing word after word, each time looking at what you have so far", technical: "[[next-token-prediction|Next-token prediction]], repeated in a loop" },
        ] },
        { type: "callout", tone: "warn", title: "Where the analogy breaks", text: "A child sounding out a word knows it is a word with a meaning. A tokenizer has no idea about meaning: its pieces come from statistics about which character sequences are frequent, and they often do not match syllables. And a phone keyboard uses a tiny model compared with an LLM, which takes thousands of earlier tokens into account at once." },
      ],
    },
    {
      kind: "visual",
      mode: "experiment",
      title: "Watch text turn into tokens",
      blocks: [
        { type: "p", text: "Type anything in the box, or pick an example. Each coloured box is one token; a dot `·` marks a space that belongs to the token. Compare English with Luganda, code and numbers, then try the challenge at the bottom." },
        { type: "lab", lab: "tokenizer", required: true, caption: "An illustrative tokenizer written for this course: real models each have their own, with much larger vocabularies." },
        { type: "callout", tone: "sim", text: "This tokenizer is **not** any real model's tokenizer. Its vocabulary of a few thousand pieces was written by hand, and it uses a simple “longest piece that fits” rule. Real tokenizers (for example, byte-pair encoding) **learn** vocabularies of tens of thousands to a few hundred thousand pieces from data. The behaviours shown are real tendencies; the exact counts are illustrative." },
      ],
    },
    {
      kind: "technical",
      mode: "understand",
      title: "Tokens, probabilities and temperature",
      blocks: [
        { type: "p", text: "**Tokenization.** Before a model sees any text, a [[tokenization|tokenizer]] cuts it into [[token|tokens]] and replaces each with an id number from a fixed vocabulary. Inside the model, each id is turned into a long list of numbers called an [[embedding|embedding]], learned during training. Tokens used in similar ways end up with similar embeddings." },
        { type: "list", items: [
          "**Every model family has its own tokenizer.** The same sentence can be 12 tokens for one model and 15 for another.",
          "For English, a commonly quoted rule of thumb is about 4 characters, or roughly three-quarters of a word, per token. It is only a rough guide.",
          "**Languages that are less common in the training data, such as Luganda or Runyankore, often use noticeably more tokens per word than English.** This is a commonly observed tendency; the exact ratio depends on the model and the text. Measure it with your provider's own tools before you rely on a number.",
          "Numbers, unusual capitals, code and emoji can also split into many tokens.",
        ] },
        { type: "callout", tone: "cost", text: "Model APIs charge per token, usually with separate prices for input tokens (what you send) and output tokens (what the model writes), typically quoted in US dollars per million tokens. Context limits and speed are also measured in tokens. More tokens per message means a higher bill and less room in the context window (Lesson 3)." },
        { type: "p", text: "**Next-token prediction.** Given all the tokens so far, the model computes a score for **every** token in its vocabulary. These scores are turned into probabilities that add up to 1 (a step called **softmax**). That list of probabilities is a **distribution**." },
        { type: "steps", items: [
          { title: "Predict", text: "Run the tokens so far through the model to get a probability for every possible next token." },
          { title: "Pick", text: "Choose one token from the distribution. This is [[sampling|sampling]]." },
          { title: "Append", text: "Add the chosen token to the text." },
          { title: "Repeat", text: "Go back to Predict, until the model produces a special end token or a maximum length (often set with a `max_tokens` setting) is reached." },
        ] },
        { type: "p", text: "**Temperature** reshapes the distribution before picking. Each score is divided by the temperature before softmax. With temperature below 1, the likeliest tokens become even likelier (more predictable). Above 1, the probabilities move closer together (more varied, and more likely to drift). At 0, many systems simply pick the single likeliest token (“greedy”)." },
        { type: "table", caption: "Choosing variability", head: ["Task", "Typical choice", "Why"], rows: [
          ["Pulling quantities out of an order into fixed fields", "Low variability", "You want the same, predictable output every time"],
          ["Classifying a message as “order”, “question” or “complaint”", "Low variability", "Consistency matters more than creativity"],
          ["Suggesting ten names for a new juice stall", "Higher variability", "Variety is the point"],
        ] },
        { type: "callout", tone: "warn", title: "Check your provider's documentation", text: "Settings differ between providers and models, and they change. Some models let you set temperature (and related settings such as top-p); some newer models ignore it, restrict it, or do not offer it. Some APIs offer a seed setting for more repeatable results. Even with the most predictable settings, real services do not always return identical text, because of how computations are run on their servers. Design your code to check outputs rather than assume they are identical." },
        { type: "callout", tone: "misconception", text: "“The most probable continuation is the true one.” Probability here means “likely to come next in text like this”, not “likely to be true”. A false sentence can be very probable if it sounds like many true sentences." },
      ],
    },
    {
      kind: "example",
      mode: "understand",
      title: "The real sampling code, and tokens in a real API response",
      blocks: [
        { type: "p", text: "This is the code from the next-token lab (`src/labs/m03/ngram.ts`) that applies temperature and picks a token. Real systems do the same mathematics over a vocabulary of tens of thousands of tokens." },
        { type: "code", lang: "ts", code: `export function applyTemperature(probs: number[], t: number): number[] {
  if (probs.length === 0) return [];
  if (t <= 0) {
    const best = probs.indexOf(Math.max(...probs));
    return probs.map((_, i) => (i === best ? 1 : 0));
  }
  const logits = probs.map((p) => Math.log(p) / t);
  const max = Math.max(...logits);
  const exps = logits.map((l) => Math.exp(l - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

export function sampleIndex(probs: number[], r: number): number {
  let acc = 0;
  for (let i = 0; i < probs.length; i++) {
    acc += probs[i];
    if (r < acc) return i;
  }
  return probs.length - 1;
}`, notes: [
          { line: 3, text: "Temperature 0: put all the probability on the single most likely token (greedy)." },
          { line: 7, text: "Turn probabilities into log scores and divide by the temperature." },
          { line: 9, text: "Softmax: exponentiate and normalise so the results add up to 1. Subtracting the max first avoids overflow." },
          { line: 14, text: "Sampling: `r` is a random number between 0 and 1. Walk along the probabilities until their running total passes `r`." },
        ] },
        { type: "p", text: "Real APIs report how many tokens each request used. Here is the **shape** of a request and an abridged response from Anthropic's Messages API at the time of writing. The model name is a placeholder and the token numbers are illustrative; check the provider's current documentation for exact fields and settings." },
        { type: "code", lang: "json", caption: "Request body (sent with POST to /v1/messages, plus authentication headers)", code: `{
  "model": "MODEL_NAME",
  "max_tokens": 200,
  "messages": [
    { "role": "user", "content": "Sukaali ssente mmeka leero?" }
  ]
}`, notes: [
          { line: 3, text: "`max_tokens`: the most tokens the model may write in its reply. It may stop earlier." },
          { line: 5, text: "Your text is tokenized by the provider. You pay for these input tokens." },
        ] },
        { type: "code", lang: "json", caption: "Response (abridged)", code: `{
  "role": "assistant",
  "content": [{ "type": "text", "text": "..." }],
  "stop_reason": "end_turn",
  "usage": { "input_tokens": 19, "output_tokens": 42 }
}`, notes: [
          { line: 4, text: "`end_turn` means the model finished naturally. `max_tokens` here would mean the reply was cut off at your limit." },
          { line: 5, text: "Token counts for billing. Compare the same question in English and Luganda to see the difference for that model." },
        ] },
      ],
    },
    {
      kind: "challenge",
      mode: "experiment",
      title: "Make it repeat, make it vary",
      blocks: [
        { type: "p", text: "First, finish the tokenizer challenge above (three predictions and a shorter prompt). Then use the toy next-token predictor below." },
        { type: "list", ordered: true, items: [
          "Press **Step** a few times and watch the bars. Before each step, predict which word will be picked.",
          "Move the temperature slider while watching the bars. The dashed outline stays fixed (the original counts); the filled bar changes.",
          "Use **Run 5 times**. Find a temperature where all five sentences are identical, and one where at least four are different.",
        ] },
        { type: "lab", lab: "next-token", required: true, caption: "A toy word-count model. The temperature and seed controls genuinely change how it samples." },
        { type: "callout", tone: "sim", text: "Real LLMs are neural networks with billions of parameters, use sub-word tokens and look at thousands of earlier tokens. This toy uses whole words, looks back only one or two words, and was trained on 34 sentences. It shows the idea, “predict a distribution, pick a token, repeat”, not the scale." },
        { type: "p", text: "**Optional: build for real.**" },
        { type: "exercise", required: false, exercise: {
          id: "m3-l2-temperature",
          title: "Write applyTemperature",
          brief: "Write `applyTemperature(probs, t)`. If `t` is 0 or less, return an array with 1 at the position of the largest probability and 0 everywhere else. Otherwise divide each `Math.log(p)` by `t`, apply `Math.exp`, and divide each result by the total so they add up to 1.",
          starter: `function applyTemperature(probs, t) {
  // 1. if t <= 0: greedy (1 for the biggest, 0 for the rest)
  // 2. otherwise: score = Math.log(p) / t, then exp, then normalise
  return probs;
}
`,
          solution: `function applyTemperature(probs, t) {
  if (t <= 0) {
    const best = probs.indexOf(Math.max(...probs));
    return probs.map((_, i) => (i === best ? 1 : 0));
  }
  const exps = probs.map((p) => Math.exp(Math.log(p) / t));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}
`,
          tests: [
            { name: "temperature 1 changes nothing", expr: "applyTemperature([0.8, 0.2], 1).map((x) => Math.round(x * 1000) / 1000)", expected: [0.8, 0.2] },
            { name: "temperature 0.5 sharpens", expr: "applyTemperature([0.8, 0.2], 0.5).map((x) => Math.round(x * 1000) / 1000)", expected: [0.941, 0.059] },
            { name: "temperature 2 flattens", expr: "applyTemperature([0.8, 0.2], 2).map((x) => Math.round(x * 1000) / 1000)", expected: [0.667, 0.333] },
            { name: "temperature 0 is greedy", expr: "applyTemperature([0.2, 0.5, 0.3], 0)", expected: [0, 1, 0] },
          ],
          hints: [
            "`Math.log(p) / t` then `Math.exp(...)` is the same as `p ** (1 / t)`.",
            "Add up all the new values with `reduce`, then divide each one by that total.",
            "For temperature 0, `probs.indexOf(Math.max(...probs))` finds the position of the biggest probability.",
          ],
        } },
      ],
    },
    {
      kind: "failure",
      mode: "understand",
      title: "Variable wording and cut-off replies",
      blocks: [
        { type: "p", text: "**Failure 1: the check that only works sometimes.** Brian's code asks the model “Is this message an order? Answer yes or no” and then checks `if (reply === \"yes\")`. Most days it works. Sometimes the model replies “Yes.” or “Yes, it is an order”, and the check fails, so real orders are ignored." },
        { type: "callout", tone: "warn", title: "How to recognise it", text: "A feature works in testing and fails occasionally with the same kind of input. The logs show the model's wording varying." },
        { type: "p", text: "**Fix:** reduce variability where the provider allows it, ask for a strict format, and, most importantly, **validate in code** (for example, lower-case it, trim it, accept only known values, retry or flag otherwise). Module 4 covers structured outputs that make this reliable." },
        { type: "p", text: "**Failure 2: the reply stops mid-sentence.** A long reply in Luganda ends halfway: “Omuceere guli…”. The response shows `\"stop_reason\": \"max_tokens\"`. The same reply in English fitted, but the Luganda version needed more tokens than the limit allowed." },
        { type: "p", text: "**Fix:** check `stop_reason` in your code, set `max_tokens` with headroom for the languages your users write in, and measure real token counts with your provider's token-counting tools rather than guessing from word counts." },
      ],
    },
    {
      kind: "quiz",
      mode: "understand",
      blocks: [
        { type: "quiz", questions: [
          {
            id: "q1", type: "mcq", flavour: "recall",
            prompt: "What is a **token**?",
            options: [
              { text: "Exactly one word", why: "Common words are often one token, but many words split into several, and spaces and punctuation are tokens too." },
              { text: "A chunk of text from the model's vocabulary, often a word or part of a word, which the model handles as an id number", why: "Correct. Tokens are the units a model reads, writes and is billed in." },
              { text: "A password that lets you use the API", why: "That is an API key (Module 5). Confusingly, some people also call keys “tokens”, but not here." },
              { text: "One letter", why: "Single letters can be tokens when nothing longer fits, but most tokens are longer." },
            ],
            answer: 1,
            hint: "Look at the coloured boxes in the tokenizer lab.",
          },
          {
            id: "q2", type: "multi", flavour: "recall",
            prompt: "Which statements about tokenizers are true? Select all that apply.",
            options: [
              { text: "Different model families use different tokenizers, so token counts differ.", why: "True. Always count with the tokenizer of the model you use." },
              { text: "Languages such as Luganda often use more tokens per word than English.", why: "True as a common tendency. The exact ratio depends on the model." },
              { text: "Long numbers may be split into several tokens.", why: "True. Many tokenizers split digits into groups." },
              { text: "Every language uses the same number of tokens per word.", why: "False. Languages that are less common in training data usually split into more pieces." },
            ],
            answers: [0, 1, 2],
            hint: "Remember the comparison bars in the lab, and that the lab is only an illustration.",
          },
          {
            id: "q3", type: "order",
            prompt: "Put the steps of generating text in order.",
            items: [
              "The text so far is turned into tokens",
              "The model computes a probability for every possible next token",
              "One token is picked (sampling, shaped by temperature)",
              "The picked token is added to the text",
              "Repeat until an end token or the maximum length",
            ],
            hint: "Predict, pick, append, repeat.",
            explanation: "Text becomes tokens; the model produces a distribution; sampling picks one token; it is appended; the loop repeats until it stops.",
          },
          {
            id: "q4", type: "mcq", flavour: "predict",
            prompt: "In the toy lab, temperature is set to **0** and you press **Run 5 times** with five different seeds. What will you see?",
            options: [
              { text: "Five different sentences, because the seeds are different", why: "At temperature 0 the toy always picks the top word, so the random number never matters." },
              { text: "Five identical sentences", why: "Correct. Greedy picking ignores randomness. (Real services may still vary slightly, for technical reasons.)" },
              { text: "An error, because temperature cannot be 0", why: "Temperature 0 is handled as greedy picking." },
            ],
            answer: 1,
            hint: "What does temperature 0 do to the distribution?",
          },
          {
            id: "q5", type: "mcq", flavour: "design",
            prompt: "Your code asks a model to pull the quantity and product out of “2 trays of eggs please” into fixed fields. Which approach is best?",
            options: [
              { text: "High variability, so it can be creative", why: "Creativity is the opposite of what you want for extraction." },
              { text: "Low variability where supported, a strict output format, and validation in your code", why: "Correct. Make it predictable, and still check the result." },
              { text: "Any setting is fine, because the model is always consistent", why: "Sampling can vary the output. Never assume identical replies." },
            ],
            answer: 1,
            hint: "Do you want variety or consistency here?",
          },
          {
            id: "q6", type: "mcq", flavour: "debug",
            prompt: "A reply ends mid-sentence and the response says `\"stop_reason\": \"max_tokens\"`. What is the most likely fix?",
            options: [
              { text: "Increase `max_tokens`, and handle this stop reason in your code", why: "Correct. The model hit the output limit you set." },
              { text: "Raise the temperature", why: "Temperature changes how tokens are picked, not how many are allowed." },
              { text: "Switch the customer to English", why: "That might use fewer tokens, but the real problem is the limit. Never make users change language to suit your settings." },
            ],
            answer: 0,
            hint: "Read the stop reason literally.",
          },
        ] },
      ],
    },
    {
      kind: "teachback",
      mode: "understand",
      blocks: [
        { type: "teachback",
          prompt: "Your cousin asks: “How does ChatGPT write its answer, and why did it give me a different answer when I asked the same thing again?” Explain in your own words.",
          rubric: [
            { concept: "Text is split into tokens", keywords: ["token", "pieces", "chunks", "parts of words"], hint: "What does the model actually read and write?" },
            { concept: "It predicts probabilities for the next token", keywords: ["predict", "probabilit", "likely", "chance", "next"], hint: "What does the model produce at each step?" },
            { concept: "One token at a time, in a loop", keywords: ["one at a time", "one by one", "repeat", "loop", "again and again", "each step"], hint: "Is the whole answer produced at once?" },
            { concept: "Picking involves randomness controlled by temperature", keywords: ["temperature", "random", "sampl", "pick", "choose"], hint: "Why can the same question give a different answer?" },
          ],
          exemplar: "Your question is first cut into tokens, which are small pieces of words, and each piece is turned into a number. The model then works out a probability for every possible next token. One token is picked, added to the reply, and the model does the same thing again, one token at a time, until it decides to stop. The picking involves some randomness, controlled by a setting called temperature: if it is not set to always choose the most likely token, asking the same question twice can give different wording. A high-probability answer is not guaranteed to be true; it is just likely-sounding.",
        },
      ],
    },
    {
      kind: "recap",
      mode: "understand",
      blocks: [
        { type: "recap",
          summary: "Text is cut into **tokens** by a model-specific **tokenizer**; Luganda and other less-represented languages often need more tokens per word. Tokens drive **cost, limits and speed**. A model generates text by **next-token prediction**: it computes a **distribution**, **samples** one token, appends it and repeats. **Temperature** sharpens or flattens the distribution; likely does not mean true.",
          canNow: [
            "Explain what a token is and why token counts differ between languages and models.",
            "Describe the predict, pick, append, repeat loop.",
            "Predict how temperature changes outputs, and choose sensible settings for a task.",
            "Spot a reply that was cut off by `max_tokens`.",
          ],
          next: "Next: how the model decides which earlier tokens matter (attention), and the hard limit on how many tokens it can see at once (the context window).",
        },
      ],
    },
  ],
};

/* ---------------------------------------------------------------------- */
/*  m3-l3  Attention, transformers and the context window                   */
/* ---------------------------------------------------------------------- */

const l3: Lesson = {
  id: "m3-l3",
  moduleId: "m3",
  title: "Attention and the context window",
  subtitle: "How a model draws on the words around each word, and why it can only work with what fits in its window.",
  minutes: 35,
  prerequisites: ["m3-l2"],
  objectives: [
    "Describe attention intuitively: each token draws information from relevant earlier tokens.",
    "Name the **transformer** as the design behind modern LLMs and say what it is made of.",
    "Explain the **context window** as the maximum number of tokens a model can work with in one request.",
    "Explain that the model keeps no memory between requests: the app re-sends what it needs.",
    "Choose a strategy when a conversation is too long: drop old messages, summarise, or pin key facts.",
  ],
  glossary: ["attention", "transformer", "context-window", "context", "token", "system-prompt"],
  completion: [
    "Make a fact fall out of the context window, then bring it back with a pinned note.",
    "Pass the knowledge check and submit your teach-back.",
  ],
  tutor: {
    simpler:
      "Every time you send a message, the app sends the model a pile of text: instructions plus as much of the conversation as fits. That pile has a maximum size, the context window. If your name was in a message that no longer fits, the model simply never receives it. Inside the model, attention is how each word gets information from the earlier words that matter to it.",
    altAnalogy:
      "A radio presenter taking calls can only see the last few text messages on their screen. Older ones scroll off. If a listener's name scrolled off, the presenter cannot read it out, unless a producer wrote it on a sticky note at the top of the screen.",
    misconceptions: [
      "“The model remembers our whole conversation.” Each request is separate. The app re-sends the conversation each time, and only what fits in the window is seen.",
      "“A bigger window solves everything.” Bigger windows cost more per request, and models can still overlook details buried in very long inputs.",
      "“Attention means the model pays attention like a person.” It is a calculation that mixes information between tokens using weights computed from learned numbers.",
    ],
    probingQuestions: [
      "In the lab, which message held the name, and at what window size did it fall out?",
      "Why does the pinned note cost tokens too?",
      "If an app stores the full conversation in a database, does the model see all of it? Why not?",
    ],
    revisit: ["m3-l2"],
  },
  sections: [
    {
      kind: "problem",
      mode: "understand",
      title: "The assistant that forgot Nakato",
      blocks: [
        { type: "p", text: "Nakato sells tomatoes at Owino market. She chats with an AI helper about discounts, keeping stock fresh and whether to start selling onions. The conversation is long and useful." },
        { type: "p", text: "Then she asks: “By the way, what is my name?” The helper replies: “I'm sorry, I don't see your name in our conversation.” But she told it in her very first message." },
        { type: "callout", tone: "info", title: "The question for this lesson", text: "What can a model actually “see” when it writes a reply, and why would something from earlier in the same conversation disappear?" },
      ],
    },
    {
      kind: "analogy",
      mode: "understand",
      title: "A whiteboard of fixed size",
      blocks: [
        { type: "p", text: "Imagine a classroom whiteboard. Before every reply, a helper **wipes the board completely** and copies onto it the instructions and as much of the conversation as fits, newest first. The board has a fixed size. Whatever does not fit is simply not on the board." },
        { type: "p", text: "The model works only from the board. When it reads the word “she” on the board, it glances back at the earlier words to work out who “she” is. That glancing back is the idea behind **attention**." },
        { type: "analogyMap", title: "From the classroom to the model", pairs: [
          { everyday: "The whiteboard", technical: "The [[context-window|context window]]: everything the model can work with in one request" },
          { everyday: "The size of the board", technical: "The window size, measured in [[token|tokens]]" },
          { everyday: "The helper rewriting the board before every reply", technical: "Your app building each request: the model keeps no memory between requests" },
          { everyday: "Old notes that did not fit", technical: "Older messages left out of the request" },
          { everyday: "A box in the corner that is always copied", technical: "The [[system-prompt|system prompt]], or a pinned note of key facts" },
          { everyday: "Glancing back at the words that matter", technical: "[[attention|Attention]] inside the [[transformer|transformer]]" },
        ] },
        { type: "callout", tone: "warn", title: "Where the analogy breaks", text: "Nobody “reads” the board from left to right like a person. The model processes all the tokens through many layers of calculations, and attention is a mathematical weighting, not a conscious glance. The board is also not partly remembered: anything not copied onto it this time does not exist for the model." },
      ],
    },
    {
      kind: "visual",
      mode: "experiment",
      title: "Inside the model, then inside the window",
      blocks: [
        { type: "p", text: "The lab has two views. **Attention** shows the idea of tokens drawing on earlier tokens: click an underlined word. **Context window** shows a whole conversation and exactly which part the model receives." },
        { type: "lab", lab: "context-window", props: { scenario: "attention" }, caption: "Attention weights here were written by hand. The context window view uses the course's illustrative token counts." },
        { type: "callout", tone: "sim", text: "In a real transformer, attention weights are calculated from learned numbers, there are many attention “heads” in each of many layers, and individual weights are often hard to interpret. The numbers in this lab were written by a person to illustrate the idea. The assistant in the Context window view is a few lines of code that can only find facts in the text it is sent, which is exactly the limit a real model has." },
      ],
    },
    {
      kind: "technical",
      mode: "understand",
      title: "Transformers, attention and the window",
      blocks: [
        { type: "p", text: "Almost all modern LLMs use a design called the [[transformer|transformer]], introduced in a 2017 research paper titled “Attention Is All You Need”. A transformer turns each token into an embedding (a list of numbers), adds information about its position, then passes all of them through a stack of layers. Each layer has two main parts: an **attention** step and a step that transforms each token's numbers on their own." },
        { type: "p", text: "**Attention, step by step (simplified):** for the token being processed, the model calculates a relevance score for each token it is allowed to look at. The scores are turned into weights that add up to 1. The token's new representation is a weighted mix of information from those tokens. In the sentence “Mama Achen gave the rider the rice because she had packed it”, this lets the representation of “she” take in information from “Mama Achen”. Nobody wrote a rule for that; the calculations that produce such weights were learned during training." },
        { type: "list", items: [
          "**Many heads, many layers:** each layer runs several attention calculations (“heads”) in parallel, and a model has many layers. Different heads can pick up different kinds of relationships.",
          "**Only earlier tokens:** in GPT-style models that generate text, each token can only attend to itself and tokens before it, never to tokens that come after.",
          "**Why transformers won:** during training they process all the tokens of a text in parallel, which suits modern chips, and attention connects distant words directly.",
        ] },
        { type: "p", text: "**The context window** is the maximum number of tokens the model can work with in one request. It includes the system prompt, the conversation history the app sends, any documents or tool results, and, for most models, the reply it writes. Sizes vary a lot between models, from thousands to hundreds of thousands of tokens or more; check your model's documentation." },
        { type: "callout", tone: "misconception", text: "“The model remembers our chat.” Model APIs process each request on its own. A chat app makes it look continuous by **re-sending the conversation every time**. Some providers offer features that store conversation state for you, but the model still only works with what is placed in its context window for that request." },
        { type: "table", caption: "When the conversation is longer than the window", head: ["Strategy", "How it works", "Trade-off"], rows: [
          ["Drop the oldest messages", "Keep the system prompt and the newest messages that fit (what the lab does)", "Simple, but early facts vanish"],
          ["Summarise", "Replace old messages with a short summary, often written by a model", "Saves tokens; details can be lost or summarised wrongly"],
          ["Pin key facts", "Store important facts (name, address, order) and send them with every request", "Reliable for known facts; costs a few tokens each time"],
          ["Retrieve when needed", "Search stored documents or messages and include only the relevant parts", "Powerful; needs extra software (later modules)"],
          ["Refuse", "Return an error when the request is too long", "Safe, but the user must shorten it"],
        ] },
        { type: "callout", tone: "cost", text: "Every token you send is paid for on every request. A 20,000-token conversation re-sent ten times is 200,000 input tokens. Bigger windows are useful, but long contexts are slower and more expensive, and models can overlook details in the middle of very long inputs. Send what is relevant, not everything." },
      ],
    },
    {
      kind: "example",
      mode: "understand",
      title: "What an app really sends, and the code that trims it",
      blocks: [
        { type: "p", text: "Here is the shape of two consecutive requests a chat app might send to a model API (Anthropic's Messages API format). Notice that the **second request repeats the whole first exchange**. The model holds nothing in between." },
        { type: "code", lang: "json", caption: "Request 1", code: `{
  "model": "MODEL_NAME",
  "max_tokens": 300,
  "system": "You are a helpful assistant for market traders in Kampala.",
  "messages": [
    { "role": "user", "content": "Hello! My name is Nakato. I sell tomatoes at Owino market." }
  ]
}`, notes: [
          { line: 4, text: "The system prompt: sent with every request." },
          { line: 6, text: "The only message so far." },
        ] },
        { type: "code", lang: "json", caption: "Request 2: the app re-sends the history, plus the new message", code: `{
  "model": "MODEL_NAME",
  "max_tokens": 300,
  "system": "You are a helpful assistant for market traders in Kampala.",
  "messages": [
    { "role": "user", "content": "Hello! My name is Nakato. I sell tomatoes at Owino market." },
    { "role": "assistant", "content": "Nice to meet you, Nakato. How can I help with your business today?" },
    { "role": "user", "content": "Customers keep asking for a discount when they buy a whole basin." }
  ]
}`, notes: [
          { line: 6, text: "Message 1 again. If the app stopped sending it, the model would not know Nakato's name." },
          { line: 7, text: "The model's own previous reply is also sent back as input." },
        ] },
        { type: "p", text: "And this is the actual function the lab uses to decide what fits (`src/labs/m03/contextWindow.ts`):" },
        { type: "code", lang: "ts", code: `export function fitToWindow(messages: Msg[], budget: number, pinned: string[]): WindowFit {
  const pinnedTokens = pinned.reduce((s, p) => s + messageTokens({ text: p }), 0);
  const kept = messages.map(() => false);
  let used = pinnedTokens;
  for (let i = messages.length - 1; i >= 0; i--) {
    const cost = messageTokens(messages[i]);
    if (used + cost > budget) break;
    kept[i] = true;
    used += cost;
  }
  const overflow = messages.length > 0 && !kept[messages.length - 1];
  return { kept, used, pinnedTokens, overflow };
}`, notes: [
          { line: 2, text: "Pinned text (system prompt, memory note) is always included and is paid for first." },
          { line: 5, text: "Walk backwards from the newest message." },
          { line: 7, text: "Stop at the first message that does not fit. Everything older is left out." },
          { line: 11, text: "If even the newest message does not fit, the request cannot be sent as it is." },
        ] },
      ],
    },
    {
      kind: "challenge",
      mode: "experiment",
      title: "Lose a fact, then keep it",
      blocks: [
        { type: "p", text: "In the lab below (the Context window view):" },
        { type: "list", ordered: true, items: [
          "Ask **“What is my name?”** with the full window. Note which message the answer came from.",
          "Shrink the window until the first message falls outside it, and ask again. The answer should fail.",
          "Keep the window small. Turn on **Pin a memory note** and ask once more.",
          "Bonus: ask **“What did I say I will try next week?”** with a tiny window. Why does it still work?",
        ] },
        { type: "lab", lab: "context-window", required: true, caption: "Complete when a fact has fallen out of the window and a pinned note has brought it back." },
        { type: "p", text: "**Optional: build for real.**" },
        { type: "exercise", required: false, exercise: {
          id: "m3-l3-window",
          title: "Keep the most recent messages that fit",
          brief: "Write `keepRecent(messages, maxTokens)`. Use the provided `estimateTokens`. Walk from the newest message backwards, keep messages while their total fits within `maxTokens`, and stop at the first one that does not fit. Return the kept messages in their original order (oldest first).",
          starter: `function estimateTokens(text) {
  return Math.ceil(text.length / 4); // rough rule of thumb for English
}

function keepRecent(messages, maxTokens) {
  // TODO: keep the newest messages that fit, in original order
  return messages;
}
`,
          solution: `function estimateTokens(text) {
  return Math.ceil(text.length / 4); // rough rule of thumb for English
}

function keepRecent(messages, maxTokens) {
  const kept = [];
  let used = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    const cost = estimateTokens(messages[i].text);
    if (used + cost > maxTokens) break;
    kept.unshift(messages[i]);
    used += cost;
  }
  return kept;
}
`,
          tests: [
            { name: "keeps only the newest messages that fit", expr: "(() => { const m = [{ text: 'a'.repeat(40) }, { text: 'b'.repeat(20) }, { text: 'c'.repeat(8) }]; return keepRecent(m, 7).map((x) => x.text[0]); })()", expected: ["b", "c"] },
            { name: "keeps everything when the window is big", expr: "(() => { const m = [{ text: 'a'.repeat(40) }, { text: 'b'.repeat(20) }, { text: 'c'.repeat(8) }]; return keepRecent(m, 100).length; })()", expected: 3 },
            { name: "keeps nothing when even the newest does not fit", expr: "(() => { const m = [{ text: 'a'.repeat(40) }, { text: 'b'.repeat(20) }, { text: 'c'.repeat(8) }]; return keepRecent(m, 1).length; })()", expected: 0 },
            { name: "stops at the first message that does not fit", expr: "(() => { const m = [{ text: 'x' }, { text: 'a'.repeat(40) }, { text: 'c'.repeat(8) }]; return keepRecent(m, 3).map((x) => x.text[0]); })()", expected: ["c"] },
          ],
          hints: [
            "Loop backwards: `for (let i = messages.length - 1; i >= 0; i--)`.",
            "Use `break` as soon as a message would go over the limit. Do not skip it and keep looking further back.",
            "`kept.unshift(message)` adds to the front, so the result stays oldest-first.",
          ],
        } },
      ],
    },
    {
      kind: "failure",
      mode: "understand",
      title: "Forgotten addresses and oversized requests",
      blocks: [
        { type: "p", text: "**Failure 1: the forgotten delivery address.** A customer gives her address at the start of a long chat about many items. At the end, the assistant confirms delivery to a **different** area, or asks for the address again." },
        { type: "callout", tone: "warn", title: "How to recognise it", text: "A fact given early in a long conversation is missing or wrong later. Log the exact request your app sent: is the fact actually in it?" },
        { type: "p", text: "**Fix:** important facts should not depend on the conversation fitting. Store them (address, name, order) and send them with every request as a pinned note, or have a tool look them up. Module 8 covers memory and databases." },
        { type: "p", text: "**Failure 2: the request is too long.** Someone pastes an entire 200-page report into a chat. The API returns an error saying the input is too long, or the app silently cuts most of it out." },
        { type: "p", text: "**Fix:** send only the relevant parts (search or split the document first), and handle the error in your code with a clear message to the user." },
        { type: "p", text: "**Failure 3: inside the window but overlooked.** Even when everything fits, a model can miss a detail buried in a very long input. Keep requests focused, and put key instructions where they are clear and easy to find." },
      ],
    },
    {
      kind: "quiz",
      mode: "understand",
      blocks: [
        { type: "quiz", questions: [
          {
            id: "q1", type: "mcq", flavour: "recall",
            prompt: "What is the **context window**?",
            options: [
              { text: "The maximum number of tokens the model can work with in one request, including instructions, conversation and (usually) its reply", why: "Correct." },
              { text: "The browser window where you chat", why: "That is just the app's screen. The context window is a limit inside the model." },
              { text: "Everything the model has ever been told by you", why: "The model keeps nothing between requests. It only sees what is sent this time." },
              { text: "The model's training data", why: "Training data shaped the weights. The context window is about one request." },
            ],
            answer: 0,
            hint: "Think about the whiteboard.",
          },
          {
            id: "q2", type: "mcq", flavour: "predict",
            prompt: "The window is small and Nakato's name was only in message 1, which no longer fits. She asks “What is my name?”. What happens?",
            options: [
              { text: "The model answers correctly, because the app stored the message", why: "Stored is not the same as sent. Only what is in the request reaches the model." },
              { text: "The model cannot see the name. It may say it does not know, or it may make one up", why: "Correct. And making one up is the subject of the next lesson." },
              { text: "The app crashes", why: "Nothing crashes. The model just never receives that message." },
            ],
            answer: 1,
            hint: "What does the model actually receive?",
          },
          {
            id: "q3", type: "multi", flavour: "recall",
            prompt: "Which of these can be inside a model's context for one request? Select all that apply.",
            options: [
              { text: "The system prompt", why: "Yes, sent with every request." },
              { text: "Earlier messages the app chose to re-send", why: "Yes, the history is re-sent by the app." },
              { text: "Results returned by a tool", why: "Yes. Tool results are added to the context (Module 6)." },
              { text: "The shop's entire database, automatically", why: "No. Only what your code puts into the request is there." },
              { text: "A chat you had last month that the app did not include", why: "No. If it is not sent, the model cannot see it." },
            ],
            answers: [0, 1, 2],
            hint: "The context is only what is sent in this request.",
          },
          {
            id: "q4", type: "mcq", flavour: "analogy",
            prompt: "In the whiteboard analogy, what does **attention** correspond to?",
            options: [
              { text: "The size of the board", why: "That is the context window size." },
              { text: "Glancing back at the earlier words that matter for the current word", why: "Yes. Attention mixes in information from relevant earlier tokens." },
              { text: "Wiping the board", why: "That is your app rebuilding the request every time." },
            ],
            answer: 1,
            hint: "How does the model work out who “she” is?",
          },
          {
            id: "q5", type: "mcq", flavour: "design",
            prompt: "A delivery assistant must **never** lose the customer's address, even in long chats. What should you build?",
            options: [
              { text: "Just choose a model with a bigger window", why: "That delays the problem and costs more on every request. Very long chats can still overflow." },
              { text: "Store the address when it is given, and send it (or let a tool fetch it) with every request", why: "Correct. Important facts should not depend on the conversation fitting." },
              { text: "Ask the model to try harder to remember", why: "The model has no memory between requests. Asking does not create one." },
            ],
            answer: 1,
            hint: "Which option does not depend on the window size at all?",
          },
          {
            id: "q6", type: "short",
            prompt: "Why does a chat app send the whole conversation (or as much as fits) with every request?",
            modelAnswer: "Because the model keeps no memory between requests. Each request is processed on its own, so the app must include the earlier messages for the model to take them into account.",
            checklist: ["Says the model has no memory between requests", "Says the app must include the history in each request"],
          },
        ] },
      ],
    },
    {
      kind: "teachback",
      mode: "understand",
      blocks: [
        { type: "teachback",
          prompt: "Nakato asks you: “Why did the helper forget my name? I told it at the start!” Explain what happened and how the app could be fixed.",
          rubric: [
            { concept: "There is a limit (context window) measured in tokens", keywords: ["context window", "window", "limit", "token", "space", "fit"], hint: "Is there a maximum amount of text the model can work with?" },
            { concept: "The model only sees what is sent in each request; it has no memory", keywords: ["only sees", "sent", "each request", "no memory", "doesn't remember", "does not remember", "every time"], hint: "Where does the model get the conversation from?" },
            { concept: "Older messages were dropped", keywords: ["old", "earlier", "first message", "dropped", "cut", "left out", "fell out"], hint: "Which messages are left out when it is full?" },
            { concept: "Fix: pin or store key facts, or summarise", keywords: ["pin", "note", "store", "save", "summar", "database", "memory"], hint: "How could the name survive?" },
          ],
          exemplar: "The model has no memory of its own. Every time you send a message, the app sends it the instructions plus as much of the conversation as fits in its context window, which is a limit counted in tokens. Your conversation got long, so the oldest messages, including the first one with your name, no longer fitted and were left out. The model never received your name, so it could not answer. The app can fix this by saving important facts like your name and sending them as a short note with every request, or by summarising old messages.",
        },
      ],
    },
    {
      kind: "recap",
      mode: "understand",
      blocks: [
        { type: "recap",
          summary: "Modern LLMs are **transformers**: stacks of layers in which **attention** lets each token draw information from relevant earlier tokens, using weights calculated from learned numbers. The **context window** is the maximum number of tokens per request. The model keeps **no memory between requests**; the app re-sends what matters, and anything that does not fit is invisible to the model.",
          canNow: [
            "Explain attention in plain words, and say which parts of an illustration are simplified.",
            "Explain what the context window contains and why old messages disappear.",
            "Choose a strategy for long conversations: trim, summarise, pin facts or retrieve.",
          ],
          next: "Next: what happens when the model does not have the facts at all. Hallucinations, private data, and why models need tools to act.",
        },
      ],
    },
  ],
};

/* ---------------------------------------------------------------------- */
/*  m3-l4  What models cannot do alone                                      */
/* ---------------------------------------------------------------------- */

const l4: Lesson = {
  id: "m3-l4",
  moduleId: "m3",
  title: "What models cannot do alone",
  subtitle: "Hallucinations, private data and real-world actions, and why they lead to tools and agents.",
  minutes: 35,
  prerequisites: ["m3-l3"],
  objectives: [
    "Define a **hallucination** and explain why a language model produces them.",
    "Explain why fluent, confident language is not evidence of accuracy.",
    "Explain why a model cannot see private systems (shop records, bank accounts, school databases) unless software gives it the data.",
    "Explain why a model cannot take actions by itself, and what **tools** add.",
    "Describe **grounding**: answering from retrieved records, with citations, and saying “I cannot confirm” when nothing is found.",
  ],
  glossary: ["hallucination", "grounding", "knowledge-cutoff", "tool", "tool-calling", "agent", "context"],
  completion: [
    "Label every claim correctly in two made-up answers, and ask a question with the lookup tool.",
    "Pass the knowledge check and submit your teach-back.",
  ],
  tutor: {
    simpler:
      "A language model writes text that sounds likely. It has never seen Mama Achen's records, so when asked about her opening hours it writes something that sounds like shop opening hours. Sometimes that is right by luck; often it is wrong, and it sounds equally sure either way. The fix is to let code look up the real record and make the model answer from that.",
    altAnalogy:
      "A very well-read visitor who has never been to your village is asked when the village market opens. They have read about thousands of markets, so they confidently say “7 o'clock”. They might even be right. But you would only trust the answer if they had checked the market's own notice board, and could show you where it says so.",
    misconceptions: [
      "“If it sounds confident, it is probably right.” Confidence in the wording tells you nothing about whether the facts were available to the model.",
      "“A hallucination is a bug that will be fixed soon.” It comes from how models work: producing likely text. Better models and grounding reduce it, but you must still design for it.",
      "“The model can see my company's data because it is connected to the internet.” A model only sees what software puts into its context.",
      "“The model said it sent the SMS, so it did.” Text describing an action is not the action. Only code that calls a real service performs it.",
      "“A claim that happened to be correct was fine.” It was unsupported when it was written. Next time, the same kind of guess may be wrong.",
    ],
    probingQuestions: [
      "When you pressed “Ask the same question again”, what changed? What does that tell you?",
      "Which claims were correct by luck? Why are they still a problem?",
      "In the grounded answer, who fetched the record: the model or the code?",
    ],
    revisit: ["m3-l2", "m0-l1"],
  },
  sections: [
    {
      kind: "problem",
      mode: "understand",
      title: "A wasted trip from Ntinda",
      blocks: [
        { type: "p", text: "Mama Achen's new WhatsApp chatbot is busy on a Sunday morning. A customer asks: “Are you open this afternoon?” The bot replies warmly: “Yes! We're open until 6 pm on Sundays. See you soon!”" },
        { type: "p", text: "The customer takes a boda from Ntinda and arrives at 4 pm. The shop closed at 2 pm. The bot had never seen the shop's opening hours. Later the same day it tells another customer, “Your order is confirmed and on its way”, although nothing was ordered and no rider was sent." },
        { type: "callout", tone: "info", title: "The question for this lesson", text: "Why does a language model state things it cannot know, and what must be added around it so that it answers from facts and can actually do things?" },
      ],
    },
    {
      kind: "analogy",
      mode: "understand",
      title: "The confident new assistant on day one",
      blocks: [
        { type: "p", text: "Imagine a new shop assistant on their first morning. They are articulate and have heard about thousands of shops. Mama Achen has not yet shown them the record book, the price list or the phone." },
        { type: "list", items: [
          "Asked about Sunday hours, they answer from a general impression of “what shops usually do”.",
          "Asked to arrange a delivery, they say “Done!”, but they have no phone and called nobody.",
          "A good assistant would say: “Let me check the record book” and “I'll ask Mama Achen to call the rider.”",
        ] },
        { type: "analogyMap", title: "From the shop floor to the model", pairs: [
          { everyday: "General impressions of how shops work", technical: "Patterns learned in training: plausible, but not this shop's facts" },
          { everyday: "Mama Achen's record book", technical: "Private data: databases and files the model was never trained on" },
          { everyday: "Checking the book before answering", technical: "[[grounding|Grounding]]: a [[tool|tool]] fetches the record; the answer is built from it" },
          { everyday: "“The book says 2 pm, page 3”", technical: "A citation: the answer points to the record it came from" },
          { everyday: "Saying “Done!” with no phone", technical: "Text describing an action that no code performed" },
          { everyday: "Using the shop phone, with Mama Achen's OK", technical: "A tool that performs an action, with [[human-approval|human approval]]" },
        ] },
        { type: "callout", tone: "warn", title: "Where the analogy breaks", text: "A human assistant usually knows when they are guessing. A language model has no reliable internal signal that separates “this came from my training data” from “this just sounds right”. It can produce a guess in exactly the same confident tone as a fact. Models sometimes express uncertainty, but you cannot rely on that." },
      ],
    },
    {
      kind: "visual",
      mode: "experiment",
      title: "Fluent, confident, and unsupported",
      blocks: [
        { type: "p", text: "Pick a customer question and press **Ask** with the tool **off**. Then check each claim in the answer against Mama Achen's records (you can open them; the model could not). Next, press **Ask the same question again**. Finally, switch on **Verify with shop records** and ask again." },
        { type: "lab", lab: "hallucination", required: true, caption: "The model's answers are simulated. The records and the lookup tool are real code in this lab." },
        { type: "callout", tone: "sim", text: "No real model is called here. The no-lookup answers were written by hand to show **typical** behaviour of a language model with no access to the shop's records: fluent, specific and unsupported. A real model might word things differently, but it would still have no way to know these records. The grounded path uses a real search function over real (fictional) records." },
      ],
    },
    {
      kind: "technical",
      mode: "understand",
      title: "Four things a model cannot do on its own",
      blocks: [
        { type: "p", text: "**1. Guarantee facts.** A [[hallucination|hallucination]] is output that is fluent and plausible but false, or not supported by any source the model was given. It happens because the model was trained to produce **likely** text. When the true answer is not in its context, and was not reliably in its training data, the likeliest-sounding text is still produced. Training to be helpful also pushes towards giving **an** answer rather than none." },
        { type: "list", items: [
          "**Fluency is not evidence.** The grammar, tone and confidence come from patterns in language, not from checking facts.",
          "**Specific details are a warning sign** when no source was provided: exact prices, times, names, dates, statistics, quotations.",
          "**Inconsistency is a clue.** If the “facts” change when you ask again, they were not drawn from a fixed source.",
          "**Even grounded answers can go wrong.** A model can misread or misquote a document it was given. Grounding greatly reduces errors; it does not eliminate them.",
        ] },
        { type: "p", text: "**2. See private or recent data.** A model's weights were fixed at the end of training, at its [[knowledge-cutoff|knowledge cutoff]]. Mama Achen's records, a customer's mobile money balance and a school's exam results were never in its training data (and should not be). The model can only work with such data if **your software puts it into the [[context|context]]** for that request, usually by running a tool or a search." },
        { type: "p", text: "**3. Take actions.** A model produces text. It cannot send an SMS, move money, update a database or call a rider. With [[tool-calling|tool calling]], it can produce a structured **request** for an action. Your code decides whether that request is allowed, runs the real function, and reports the result back. Text that says “I have sent it” is not evidence that anything was sent." },
        { type: "p", text: "**4. Check itself reliably.** You cannot fix hallucination by asking the model “Are you sure?”. It may agree, or apologise and change a correct answer. Checks that matter must be done by code or by people against real sources." },
        { type: "table", caption: "Limitations and what to add", head: ["Limitation", "Why", "What to add"], rows: [
          ["Makes up specific facts", "Produces likely text; may not have the fact", "A lookup tool, answers only from the result, citations, permission to say “I cannot confirm”"],
          ["Cannot see private data", "Not in training data; not in the request", "Tools or search that fetch the data, with access controls"],
          ["Does not know recent events", "Training data ends at a cutoff", "Tools that fetch current information"],
          ["Cannot act", "Produces only text", "Tools run by your code, with validation, limits and human approval"],
          ["Calculations can be wrong", "Predicts digits as tokens; not a calculator", "Let code do the arithmetic"],
        ] },
        { type: "p", text: "**[[grounding|Grounding]]** puts these together: code fetches the relevant records, places them in the context, the model is instructed to answer only from them and to cite them, and an honest “I cannot confirm that” is allowed and expected. When the model can also request tools in a loop, run by your code with controls, you have the beginning of an [[agent|agent]]." },
      ],
    },
    {
      kind: "example",
      mode: "understand",
      title: "A real lookup tool and its instructions",
      blocks: [
        { type: "p", text: "A tool is described to the model by a name, a description and an input schema. Here is a definition in the format Anthropic's Messages API uses for tools (`name`, `description`, `input_schema`):" },
        { type: "code", lang: "json", code: `{
  "name": "lookup_shop_records",
  "description": "Search Mama Achen's shop records (opening hours, prices, delivery, payment). Returns matching records with their ids.",
  "input_schema": {
    "type": "object",
    "properties": {
      "question": { "type": "string", "description": "The customer's question" }
    },
    "required": ["question"]
  }
}`, notes: [
          { line: 2, text: "The name the model uses when it asks for this tool." },
          { line: 3, text: "The description helps the model decide when the tool is useful." },
          { line: 4, text: "A JSON Schema describing the input. Your code should still validate it (Module 6)." },
        ] },
        { type: "p", text: "The instructions (system prompt) tell the model how to use what comes back:" },
        { type: "code", lang: "text", code: `Answer customer questions about Mama Achen's shop.
Use only the records returned by lookup_shop_records.
After each fact, cite the record id in square brackets, like [R1].
If no record answers the question, say: "I cannot confirm that from the shop records."
Never say an order is placed or a delivery is arranged unless a tool result confirms it.`, notes: [
          { line: 2, text: "Restrict the source of facts." },
          { line: 3, text: "Citations let people, and code, check each claim." },
          { line: 4, text: "Make “I don't know” an expected, acceptable answer." },
          { line: 5, text: "Words are not actions." },
        ] },
        { type: "p", text: "And this is the actual search function the lab's tool runs (`src/labs/m03/hallucination.ts`). It is deliberately simple: it scores each record by how many of its keywords appear in the question." },
        { type: "code", lang: "ts", code: `export function lookupRecords(question: string): ShopRecord[] {
  const words: string[] = question.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  const scored = RECORDS.map((r) => ({ r, score: r.keywords.filter((k) => words.includes(k)).length }));
  const best = Math.max(0, ...scored.map((s) => s.score));
  if (best === 0) return [];
  return scored.filter((s) => s.score === best).map((s) => s.r);
}`, notes: [
          { line: 2, text: "Split the question into lower-case words." },
          { line: 3, text: "Count how many of each record's keywords appear." },
          { line: 5, text: "Nothing matched: return an empty list. The honest answer is then “I cannot confirm”." },
          { line: 6, text: "Return the best-matching record(s). Real systems use databases or search indexes, but the principle is the same: code fetches the facts." },
        ] },
        { type: "callout", tone: "tip", text: "Your code can also check the citations: does every `[R…]` in the answer refer to a record that was actually returned? If not, flag the answer instead of sending it." },
      ],
    },
    {
      kind: "challenge",
      mode: "experiment",
      title: "Be the fact-checker",
      blocks: [
        { type: "p", text: "Use the lab above. For each no-lookup answer, label every claim: **Matches** the records, **Contradicts** them, or **Not in records**. Get every claim right in two different answers. Then ask any question with the lookup tool on, and compare." },
        { type: "callout", tone: "tip", text: "Pay special attention to claims that happen to **match**. The model never saw the records, so even a correct claim was unsupported when it was written." },
        { type: "p", text: "**Optional: build for real.** Replace a fluent guess with a grounded answer." },
        { type: "exercise", required: false, exercise: {
          id: "m3-l4-grounded",
          title: "Answer only from records",
          brief: "Write `groundedAnswer(question)`. Lower-case the question. Find the FIRST record that has at least one keyword appearing in the question. If found, return the record's text, a space, and its id in square brackets, for example `Rice, 25 kg bag: UGX 110,000. [R2]`. If none matches, return exactly `I cannot confirm that from the shop records.`",
          starter: `const RECORDS = [
  { id: "R1", keywords: ["open", "hours", "sunday"], text: "Sunday: 10:00 am to 2:00 pm." },
  { id: "R2", keywords: ["rice", "price"], text: "Rice, 25 kg bag: UGX 110,000." },
];

function groundedAnswer(question) {
  // A fluent guess. Replace it with an answer built only from RECORDS.
  return "Yes, of course! We are open every day and everything is in stock.";
}
`,
          solution: `const RECORDS = [
  { id: "R1", keywords: ["open", "hours", "sunday"], text: "Sunday: 10:00 am to 2:00 pm." },
  { id: "R2", keywords: ["rice", "price"], text: "Rice, 25 kg bag: UGX 110,000." },
];

function groundedAnswer(question) {
  const q = question.toLowerCase();
  const record = RECORDS.find((r) => r.keywords.some((k) => q.includes(k)));
  if (!record) return "I cannot confirm that from the shop records.";
  return record.text + " [" + record.id + "]";
}
`,
          tests: [
            { name: "answers a price question from R2, with a citation", expr: "groundedAnswer('What is the price of rice?')", expected: "Rice, 25 kg bag: UGX 110,000. [R2]" },
            { name: "answers an opening-hours question from R1", expr: "groundedAnswer('Are you OPEN on Sunday?')", expected: "Sunday: 10:00 am to 2:00 pm. [R1]" },
            { name: "says it cannot confirm when no record matches", expr: "groundedAnswer('Do you sell airtime?')", expected: "I cannot confirm that from the shop records." },
          ],
          hints: [
            "`question.toLowerCase()` makes “OPEN” match “open”.",
            "`RECORDS.find((r) => r.keywords.some((k) => q.includes(k)))` finds the first record with a matching keyword.",
            "Build the answer with `record.text + \" [\" + record.id + \"]\"`.",
          ],
        } },
      ],
    },
    {
      kind: "failure",
      mode: "understand",
      title: "When grounding is not enough",
      blocks: [
        { type: "p", text: "**Failure 1: the records are out of date.** Mama Achen changed her Sunday hours but nobody updated record R1. The grounded assistant now confidently cites the old hours. Grounding is only as good as the data." },
        { type: "callout", tone: "warn", title: "How to recognise it", text: "The answer is correctly cited, and the cited record itself is wrong. Customers complain even though the system “followed the rules”." },
        { type: "p", text: "**Fix:** keep records current, show when each record was last updated, and give staff an easy way to correct them." },
        { type: "p", text: "**Failure 2: an action that never happened.** The assistant replies “Your order is confirmed!” but the trace shows no successful `place_order` tool result. **Fix:** your code, not the model's wording, decides what the customer is told about actions. Only confirm after a tool result says it succeeded." },
        { type: "p", text: "**Failure 3: a made-up citation.** The answer says “[R7]”, but there is no R7, or R7 says something different. **Fix:** check in code that every cited id was actually returned by the tool, and that the cited record supports the claim where you can check it (for example, numbers)." },
      ],
    },
    {
      kind: "quiz",
      mode: "understand",
      blocks: [
        { type: "quiz", questions: [
          {
            id: "q1", type: "mcq", flavour: "recall",
            prompt: "What is a **hallucination** in AI?",
            options: [
              { text: "When the model crashes or returns an error", why: "An error is a failure you can see. A hallucination looks like a normal, fluent answer." },
              { text: "Fluent, plausible output that is false or not supported by any source the model was given", why: "Correct." },
              { text: "When the model refuses to answer", why: "Refusing is the opposite: no claim is made." },
              { text: "When the model writes in the wrong language", why: "That is a different problem." },
            ],
            answer: 1,
            hint: "It looks like a normal answer.",
          },
          {
            id: "q2", type: "multi", flavour: "debug",
            prompt: "Which of these are warning signs that an answer may be hallucinated? Select all that apply.",
            options: [
              { text: "It gives an exact price, but the model had no tool or document containing prices", why: "Yes. Specific details with no possible source are a strong warning sign." },
              { text: "The details change when you ask the same question again", why: "Yes. Facts from a fixed source would not change." },
              { text: "It is written in a very confident tone", why: "Not a sign either way. Confident tone appears in correct and incorrect answers alike." },
              { text: "It cites record R2, and R2 says the same thing", why: "That is a good sign: the claim can be checked and it matches." },
            ],
            answers: [0, 1],
            hint: "Ask: where could this information have come from?",
          },
          {
            id: "q3", type: "mcq", flavour: "predict",
            prompt: "A customer asks a chatbot with **no tools**: “What is my mobile money balance?” What will happen?",
            options: [
              { text: "It reads the balance from the mobile money system", why: "It has no access. Nothing connects it to that system." },
              { text: "It cannot know the balance; it may say so, or it may invent a number", why: "Correct. Private data is only available if software puts it into the context." },
              { text: "It works out the balance from the customer's previous messages", why: "Only if the balance appeared in the text it was sent, and even then it could be outdated." },
            ],
            answer: 1,
            hint: "Was this customer's balance in the training data or the request?",
          },
          {
            id: "q4", type: "mcq", flavour: "design",
            prompt: "Mama Achen's bot keeps giving wrong opening hours. What is the best fix?",
            options: [
              { text: "Add “Please be accurate” to the instructions", why: "Asking for accuracy does not give the model the facts." },
              { text: "Give it a tool that looks up the shop's records, require it to answer from the result and cite it, and allow “I cannot confirm”", why: "Correct. This is grounding." },
              { text: "Use a larger model", why: "A larger model still has never seen this shop's hours." },
              { text: "Lower the temperature", why: "That makes the made-up answer more consistent, not more correct." },
            ],
            answer: 1,
            hint: "The problem is missing facts, not style.",
          },
          {
            id: "q5", type: "mcq", flavour: "recall",
            prompt: "A chatbot with **no tools** says: “I've sent an SMS to the boda rider.” What actually happened?",
            options: [
              { text: "An SMS was sent", why: "A model alone produces text only. Nothing connected it to an SMS service." },
              { text: "Nothing was sent. The model produced text describing an action", why: "Correct. Text is not action." },
              { text: "The SMS was queued for later", why: "There is no queue: no code ran." },
            ],
            answer: 1,
            hint: "What can a model on its own produce?",
          },
          {
            id: "q6", type: "short",
            prompt: "In the lab, some made-up claims happened to match the records. Why is a lucky correct guess still a problem?",
            modelAnswer: "Because the model had no source for it: the claim was unsupported when it was written. The same process will produce wrong guesses at other times, and you cannot tell which is which without checking.",
            checklist: ["Says the claim had no source / was unsupported", "Says you cannot tell lucky guesses from wrong ones without checking"],
          },
        ] },
      ],
    },
    {
      kind: "teachback",
      mode: "understand",
      blocks: [
        { type: "teachback",
          prompt: "Mama Achen asks: “Why did my chatbot tell a customer we close at 6 on Sunday, and how do I stop it happening again?” Explain in plain words.",
          rubric: [
            { concept: "The model produces likely-sounding text, and fluent does not mean true", keywords: ["likely", "sound", "guess", "made up", "invent", "fluent", "confident", "hallucinat"], hint: "Where did “6 pm” come from?" },
            { concept: "It could not see her private records", keywords: ["record", "never seen", "can't see", "cannot see", "no access", "private", "her data"], hint: "Did the model have the real hours?" },
            { concept: "Fix: a lookup tool so answers come from the records, with citations", keywords: ["tool", "look up", "lookup", "check the record", "ground", "cite", "citation"], hint: "How can the answer come from the real record?" },
            { concept: "Allow “I don't know”, and only code performs actions", keywords: ["don't know", "do not know", "cannot confirm", "can't confirm", "code", "action", "approve"], hint: "What should it say when there is no record?" },
          ],
          exemplar: "The chatbot is a language model. It writes text that sounds likely, and it had never seen your shop's records, so it wrote something that sounds like normal shop hours. It sounded sure, but sounding sure is not the same as being right. To stop it, the software should give it a tool that looks up your real records: your code fetches the opening hours, and the bot must answer only from what came back and say which record it used. If there is no record, it should say it cannot confirm and ask you. And it should never claim it did something, like arranging a delivery, unless your code actually did it.",
        },
      ],
    },
    {
      kind: "recap",
      mode: "understand",
      blocks: [
        { type: "recap",
          summary: "A language model produces **likely text**, so without the facts it can **hallucinate**: fluent, confident and unsupported. It cannot see **private** or **recent** data unless software puts it into the context, and it cannot **act**: it only produces text, including requests for tools. **Grounding** (code fetches records, answers cite them, “I cannot confirm” is allowed) and **tools** run by your code turn a chatbot into the start of an agent.",
          canNow: [
            "Explain why fluent language does not guarantee accuracy.",
            "Check a model's claims against a source and spot unsupported ones.",
            "Explain why a model needs tools to see private data and to take actions.",
            "Describe how grounding and citations reduce hallucinations.",
          ],
          next: "You now know what a model can and cannot do on its own. In Module 4 you will learn to instruct it clearly and get structured, machine-checkable output; in Module 6 you will give it real tools.",
        },
      ],
    },
  ],
};

export const m03Lessons: Lesson[] = [l1, l2, l3, l4];
