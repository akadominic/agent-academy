import type { Lesson } from "../schema";

/* ======================================================================
   MODULE 0 — Welcome to the World of AI Agents
   Lesson m0-l1 is the QUALITY BENCHMARK for every lesson in the course.
   ====================================================================== */

const l1: Lesson = {
  id: "m0-l1",
  moduleId: "m0",
  title: "Three systems, one customer",
  subtitle: "What computers, software, chatbots and AI agents each do — seen side by side on the same request.",
  minutes: 25,
  prerequisites: [],
  objectives: [
    "Explain in plain words what a computer and software do.",
    "Describe the difference between a fixed-rules program, a chatbot and an AI agent.",
    "Explain why a chatbot can sound confident and still be wrong about a specific shop.",
    "Identify the two things that make a system an agent: **tools** and a **loop**.",
  ],
  glossary: ["computer", "software", "program", "rule-based", "ai", "llm", "chatbot", "agent", "tool", "simulation"],
  completion: [
    "Compare at least three customer messages in the side-by-side lab.",
    "Pass the knowledge check (you can retry).",
    "Explain the difference between a chatbot and an agent in your own words.",
  ],
  tutor: {
    simpler:
      "Think of three helpers at a shop. The first only understands one exact sentence. The second talks nicely but has never seen the shop's stock book, so it guesses. The third talks nicely AND is allowed to look in the stock book and use the till — and it asks the owner before selling. The third one is an agent.",
    altAnalogy:
      "Three ways to send a boda-boda rider: (1) a printed card with one fixed route; (2) a friend who gives directions from memory, sometimes wrongly; (3) a dispatcher who checks the map, phones the customer, then sends the rider — and reports back what actually happened.",
    misconceptions: [
      "“An agent is just a smarter chatbot.” The difference is not intelligence — it is access to tools and a loop run by software that checks and executes actions.",
      "“If the chatbot sounds sure, it must know.” Fluent text is not evidence. A model with no access to the shop's data can only guess.",
      "“Agents are always better.” For perfectly predictable input, a simple program is cheaper, faster and more reliable.",
    ],
    probingQuestions: [
      "The chatbot said eggs were in stock. Where could it possibly have learned that? What would it need to give a correct answer?",
      "In the agent column, who actually read the stock book — the model, or the shop's code?",
      "Name one job in your town where a fixed-rules program would be better than an agent. Why?",
    ],
  },
  sections: [
    /* A. THE PROBLEM */
    {
      kind: "problem",
      mode: "understand",
      title: "Mama Achen's busy morning",
      blocks: [
        { type: "p", text: "Mama Achen runs a shop near Nakawa market. She sells rice, posho, sugar, cooking oil, soap — the everyday things families need. Every morning her phone fills with messages:" },
        { type: "list", items: [
          "“Do you have 3 bags of rice? Deliver tomorrow please.”",
          "“How much for 2 kg sugar and one oil?”",
          "“I need 2 trays of eggs and 3 kg of beans.”",
        ] },
        { type: "p", text: "To answer each one well she must **understand** the message, **check** her price list and her stock book, **calculate** a total, **suggest** something else if an item is finished, and only then **commit** to an order. While she does this, customers wait and other messages pile up." },
        { type: "p", text: "Could a computer help her? Yes — but there are very different kinds of computer helpers, and choosing the wrong one causes real problems: a helper that refuses most messages, or worse, one that confidently promises eggs she does not have." },
        { type: "callout", tone: "info", title: "The question for this lesson", text: "What is the difference between a normal program, a chatbot, and an AI agent — and which one could actually help Mama Achen?" },
      ],
    },

    /* B. THE ANALOGY */
    {
      kind: "analogy",
      mode: "understand",
      title: "Three new shop assistants",
      blocks: [
        { type: "p", text: "Imagine Mama Achen hires three assistants for a week." },
        { type: "steps", items: [
          { title: "Assistant A follows a laminated card.", text: "The card says: “If a customer says ORDER, then a product, then a number, look up the price and say the total.” Anything else? “Sorry, I did not understand.” Very reliable — but only for exactly what is on the card." },
          { title: "Assistant B is a brilliant talker who has never been inside the shop.", text: "B has read thousands of conversations about shopping and answers every message warmly and fluently. But B cannot see the price list or the stock book, so B guesses — and the guesses sound just as confident as facts." },
          { title: "Assistant C talks well AND is allowed to use the shop's things.", text: "C reads the message, decides “I should check the stock book,” opens it, reads the answer, calculates using the till, and asks Mama Achen before confirming an order. C decides what to do next; the shop's real tools do the work." },
        ] },
        { type: "analogyMap", title: "From the shop to software", pairs: [
          { everyday: "Assistant A and the laminated card", technical: "A [[rule-based|rule-based program]]: fixed if/then instructions written by a programmer" },
          { everyday: "Assistant B, the confident talker", technical: "A [[chatbot]] built on a [[llm|large language model]] with no access to your data" },
          { everyday: "Assistant C, who uses the stock book and till", technical: "An [[agent|AI agent]]: a model that requests [[tool|tools]], with software running those tools in a loop" },
          { everyday: "Asking Mama Achen before confirming", technical: "Human approval before an action that changes data" },
        ] },
        { type: "callout", tone: "warn", title: "Where the analogy breaks", text: "Assistants B and C are people in the story, but a language model is **not** a person. It does not “know” or “intend” things the way a person does. It produces text by predicting likely next words. You will see exactly how in Module 3." },
      ],
    },

    /* C. THE VISUALISATION */
    {
      kind: "visual",
      mode: "experiment",
      title: "Watch all three handle the same message",
      blocks: [
        { type: "p", text: "Below, the same customer message goes to all three systems at once. Press **Step** to move forward one step at a time, or **Play** to watch. Click any step to inspect it." },
        { type: "lab", lab: "three-systems", required: true, caption: "Column A is real code. Column B shows typical replies from a model with no shop access (simulated). Column C runs this course's real agent loop with a simulated model." },
        { type: "callout", tone: "sim", text: "Nothing here calls a real AI service. Column B's replies were written to show **typical** chatbot behaviour; a real chatbot might word things differently, but it still cannot know this shop's stock. Column C's “model” is a rule-based stand-in that produces responses in the same format a real model API returns — so the agent loop around it is genuine." },
      ],
    },

    /* D. THE TECHNICAL EXPLANATION */
    {
      kind: "technical",
      mode: "understand",
      title: "What is really going on",
      blocks: [
        { type: "p", text: "A [[computer|computer]] is a machine that follows instructions very quickly and exactly. Those instructions are called [[software|software]]. A specific piece of software that does a job — a calculator, a till system, a game — is a [[program|program]]." },
        { type: "p", text: "**System A** is ordinary software. A programmer wrote every rule in advance. It never surprises you, which is valuable — but it cannot handle any situation nobody wrote a rule for." },
        { type: "p", text: "**System B** sends the customer's words to a [[llm|large language model]] (LLM). An LLM is a kind of [[ai|artificial intelligence]] trained on enormous amounts of text. Given some text, it produces a likely continuation. That makes it excellent with messy human language — but it only has two sources of information: patterns from its training, and whatever text you send it right now. Mama Achen's stock book is in neither." },
        { type: "p", text: "**System C** is an [[agent|AI agent]]. It still uses a language model, but three more things are added:" },
        { type: "list", ordered: true, items: [
          "**Tools** — functions written by the shop's programmer, such as `search_products` and `check_inventory`. The model is told these tools exist and what they do.",
          "**A loop** — code that asks the model “what next?”, receives a proposed tool call, checks it, **runs the real function**, gives the result back to the model, and repeats until the task is finished or a limit is reached.",
          "**Controls** — rules in the code: which tools are allowed, a maximum number of steps, and human approval before anything that changes data.",
        ] },
        { type: "callout", tone: "misconception", text: "“The AI looked in the stock book.” Not quite. The model only **asked** for the `check_inventory` tool, by producing a small piece of structured text. The shop's own code decided whether that was allowed and then ran it. The model never touches the database directly." },
        { type: "table", caption: "The three systems at a glance", head: ["", "Rules program", "Chatbot", "AI agent"], rows: [
          ["Handles messy language", "No", "Yes", "Yes"],
          ["Uses the shop's real data", "Only what was coded", "No", "Yes, through tools"],
          ["Can take actions", "Only coded ones", "No", "Yes, checked by code"],
          ["Predictable", "Very", "Not fully", "Partly — code adds limits"],
          ["Cost per message", "Almost zero", "Small", "Higher (several model calls)"],
        ] },
      ],
    },

    /* E. THE WORKING EXAMPLE */
    {
      kind: "example",
      mode: "understand",
      title: "The real code behind System A",
      blocks: [
        { type: "p", text: "Here is the complete rules program from column A. You do not need to understand every symbol yet — you will learn to write code like this in Module 2. Read the notes to see how rigid it is." },
        { type: "code", lang: "js", code: `function handle(message) {
  const match = message.match(/^ORDER (\\w+) (\\d+)$/i);
  if (!match) {
    return "Sorry, I did not understand. Please type: ORDER <product> <quantity>";
  }
  const product = match[1].toLowerCase();
  const quantity = Number(match[2]);
  const price = PRICE_TABLE[product];
  if (price === undefined) return "Unknown product: " + product;
  return "Total: UGX " + (price * quantity).toLocaleString();
}`, notes: [
          { line: 2, text: "Checks for one exact pattern: the word ORDER, a word, then a number. “3 bags of rice please” does not match." },
          { line: 3, text: "Anything that does not match gets the same fixed reply." },
          { line: 8, text: "Looks the price up in a table the programmer typed in." },
          { line: 10, text: "Calculates the total exactly — computers never make arithmetic slips." },
        ] },
        { type: "p", text: "And here is the core of the agent from column C. The model is consulted in exactly one place; everything around it is ordinary code. Open it and read the notes — this is the actual loop running in this app." },
        { type: "showCode", ref: "agent-loop" },
      ],
    },

    /* F. THE INTERACTIVE CHALLENGE */
    {
      kind: "challenge",
      mode: "experiment",
      title: "Predict, then check",
      blocks: [
        { type: "p", text: "Go back to the lab above and choose the message **“ORDER rice 3”**. Before pressing Play, predict: which of the three systems will give a correct total? Then run it." },
        { type: "p", text: "Next, choose **“Eggs and beans”**. Predict which system will wrongly say eggs are available. Run it and inspect the agent's `check_inventory` step to see where the truth came from." },
        { type: "callout", tone: "tip", text: "The lab counts this challenge complete after you have run at least three different messages all the way to the end." },
      ],
    },

    /* G. WHAT CAN GO WRONG */
    {
      kind: "failure",
      mode: "understand",
      title: "Confident and wrong",
      blocks: [
        { type: "p", text: "Look again at the chatbot's reply to the eggs message: “Yes, we have fresh eggs available!” It is polite, fluent and completely wrong — eggs are out of stock. This is one of the most important failure modes in AI engineering: **fluent language is not evidence of truth**." },
        { type: "p", text: "The chatbot also said things like “will be delivered tomorrow” — describing an action that **nobody performed**. Text that describes an action is not the action." },
        { type: "callout", tone: "warn", title: "How to recognise it", text: "Ask: where could this information have come from? If the system had no tool or document containing it, any specific price, stock level or promise is a guess." },
        { type: "p", text: "Agents can fail too — they can call the wrong tool, loop forever, or be tricked by malicious text. Much of this course is about building the code that catches those mistakes." },
      ],
    },

    /* H. KNOWLEDGE CHECK */
    {
      kind: "quiz",
      mode: "understand",
      blocks: [
        { type: "quiz", questions: [
          {
            id: "q1", type: "mcq", flavour: "recall",
            prompt: "What makes System C an **agent** rather than a chatbot?",
            options: [
              { text: "It uses a bigger, smarter language model.", why: "The model could be identical. The difference is what surrounds it." },
              { text: "It can request tools, and code runs those tools in a loop until the task is done.", why: "Yes. Tools + a loop run by software are what make a system agentic." },
              { text: "It writes longer and friendlier replies.", why: "Style has nothing to do with it. A chatbot can be just as friendly." },
              { text: "It never makes mistakes.", why: "Agents can make mistakes. Good engineering limits and catches them." },
            ],
            answer: 1,
            hint: "Look at what column C did between receiving the message and replying.",
          },
          {
            id: "q2", type: "mcq", flavour: "predict",
            prompt: "A customer types “Una sukari? 2kg” (Swahili for “Do you have sugar? 2 kg”). What will **System A** reply?",
            options: [
              { text: "The correct total for 2 kg of sugar.", why: "System A only understands messages that start with ORDER followed by a product and a number." },
              { text: "“Sorry, I did not understand. Please type: ORDER <product> <quantity>”", why: "Correct. The message does not match its single pattern, so it gives its fixed reply." },
              { text: "A guess at the price of sugar.", why: "Guessing is chatbot behaviour. System A never guesses — it either matches a rule or refuses." },
            ],
            answer: 1,
            hint: "System A has exactly one rule. Does this message fit it?",
          },
          {
            id: "q3", type: "mcq", flavour: "debug",
            prompt: "The chatbot told a customer that rice costs UGX 95,000 a bag. Mama Achen's real price is UGX 110,000. What is the **root cause**?",
            options: [
              { text: "The model is broken and needs to be replaced.", why: "A different model would have the same problem — the information simply was not available to it." },
              { text: "The model had no access to the shop's price list, so it produced a plausible guess.", why: "Exactly. The fix is to give the system a way to look up real prices — a tool." },
              { text: "The customer's message had a spelling mistake.", why: "The message was understood fine. The problem is where the price came from." },
            ],
            answer: 1,
            hint: "Ask: where could the number 95,000 have come from?",
          },
          {
            id: "q4", type: "multi", flavour: "recall",
            prompt: "In the agent, which of these are done by **ordinary code**, not by the language model? Select all that apply.",
            options: [
              { text: "Actually reading the stock level from the database", why: "Yes — the `check_inventory` function, written by a programmer, does this." },
              { text: "Calculating the exact total in UGX", why: "Yes — the `calculate_quote` tool does the arithmetic. Models are not reliable calculators." },
              { text: "Deciding that checking stock would be a sensible next step", why: "This one is the model's job: proposing which tool to use next." },
              { text: "Stopping after a maximum number of steps", why: "Yes — a limit enforced by the loop code." },
            ],
            answers: [0, 1, 3],
            hint: "The model proposes. What does the code do?",
          },
          {
            id: "q5", type: "mcq", flavour: "design",
            prompt: "A taxi park only ever receives SMS messages in the exact format `BOOK <route> <seats>`. Which system should they build?",
            options: [
              { text: "An AI agent, because agents are the most modern option.", why: "Modern is not a requirement. This adds cost and unpredictability for no benefit." },
              { text: "A rules program, because the input is perfectly predictable.", why: "Right. Predictable input → simple, cheap, reliable program. Knowing when NOT to use AI is a core skill." },
              { text: "A chatbot, so the replies sound friendly.", why: "Friendly replies do not help if the system cannot check seats or book them." },
            ],
            answer: 1,
            hint: "What is special about the format of their messages?",
          },
        ] },
      ],
    },

    /* I. TEACH IT BACK */
    {
      kind: "teachback",
      mode: "understand",
      blocks: [
        { type: "teachback",
          prompt: "Your cousin runs a hardware shop in Mbarara and says: “I tried ChatGPT and it gave me wrong prices. So AI agents are useless.” In your own words, explain the difference between a chatbot and an agent, and why the agent could give correct prices.",
          rubric: [
            { concept: "A chatbot has no access to the shop's own data", keywords: ["no access", "doesn't know", "does not know", "can't see", "cannot see", "guess", "training", "memory"], hint: "Say where a chatbot's answers come from — and what it cannot see." },
            { concept: "An agent uses tools to look up real information", keywords: ["tool", "look up", "check", "database", "stock", "price list"], hint: "Mention how an agent gets real prices." },
            { concept: "Code runs the tools, not the model", keywords: ["code", "program", "software", "runs the", "executes"], hint: "Who actually opens the stock book?" },
            { concept: "Limits or human approval", keywords: ["approve", "approval", "owner", "limit", "check before", "human"], hint: "What stops an agent doing something wrong?" },
          ],
          exemplar: "ChatGPT on its own is a chatbot: it writes answers from patterns it learned in training, and it has never seen your price list, so it guesses — and the guesses sound confident. An agent uses the same kind of model, but your shop's software gives it tools, like 'look up price' and 'check stock'. The model asks for a tool, your code actually runs it on your real data, and the model writes its answer from what came back. The code also sets limits — for example, it asks you to approve before any order is confirmed. So the agent can be correct where the chatbot could only guess.",
        },
      ],
    },

    /* J. RECAP */
    {
      kind: "recap",
      mode: "understand",
      blocks: [
        { type: "recap",
          summary: "A **program** follows fixed rules. A **chatbot** uses a language model to produce fluent text, but only knows its training and what you send it. An **agent** lets the model request **tools**, while **code** runs those tools in a **loop**, with limits and approvals. Fluent text is not evidence; real data comes from tools.",
          canNow: [
            "Tell a rules program, a chatbot and an agent apart by what they can see and do.",
            "Explain why a chatbot can be confidently wrong about a specific business.",
            "Point to where, in an agent, the model decides and where code acts.",
          ],
          next: "In the next lesson we look more closely at what AI and ChatGPT actually are, and at the parts every agent is made of.",
        },
      ],
    },
  ],
};

const l2: Lesson = {
  id: "m0-l2",
  moduleId: "m0",
  title: "What AI, ChatGPT and agents really are",
  subtitle: "The few parts every agent is made of — and which part does what.",
  minutes: 25,
  prerequisites: ["m0-l1"],
  objectives: [
    "Explain how AI that **learns from examples** differs from software that follows written rules.",
    "Describe what a [[llm|large language model]] does in one sentence, and what ChatGPT adds on top.",
    "Name the core parts of an agent: interface, instructions, model, tools and the loop.",
    "Explain why a model cannot remember or act on its own.",
  ],
  glossary: ["ai", "llm", "chatbot", "agent", "agentic", "tool", "token", "workflow"],
  completion: [
    "Inspect at least three parts in the agent anatomy diagram.",
    "Pass the knowledge check.",
    "Explain the parts of an agent in your own words.",
  ],
  tutor: {
    simpler:
      "A language model is a text-prediction machine: give it some text, and it writes what most likely comes next. ChatGPT is a website that lets you chat with one. An agent is a program YOU write that asks a model what to do next, then actually does it with tools, again and again until the job is done.",
    altAnalogy:
      "Think of a taxi park. The model is a sharp-eyed advisor who says 'send the Entebbe taxi now'. The loop is the dispatcher who listens, checks, and actually sends the taxi. The tools are the phones, the vehicles and the logbook. The instructions are the park's rules painted on the wall.",
    misconceptions: [
      "“ChatGPT and the model are the same thing.” ChatGPT is a product: a website and apps built around a model, with extra features added by the company.",
      "“The model remembers our earlier chats.” Each request starts fresh. Any 'memory' is software re-sending earlier text or saved notes.",
      "“The model runs the tools.” It only produces a structured request. Your code runs the tool.",
    ],
    probingQuestions: [
      "If a model only predicts text, how can an agent built on it place an order?",
      "Which part of an agent would you change to stop it from ever creating orders without permission?",
      "Where does an agent's 'memory' of the current task actually live?",
    ],
    revisit: ["m0-l1"],
  },
  sections: [
    {
      kind: "problem", mode: "understand", title: "Everyone says “AI”, but what is it?",
      blocks: [
        { type: "p", text: "Your friend says: “ChatGPT is AI, my phone's keyboard is AI, and now there are AI agents too.” They are all called AI, yet they do very different things. If you want to **build** these systems, you need to know exactly which part does what — because each part fails in its own way." },
        { type: "callout", tone: "info", title: "The question for this lesson", text: "What is a language model, what does ChatGPT add, and which parts must be added around a model to make an agent?" },
      ],
    },
    {
      kind: "analogy", mode: "understand", title: "Learning to mark exam scripts",
      blocks: [
        { type: "p", text: "There are two ways to get someone to mark exam scripts. You can write a **marking guide** with exact rules: “Question 3: award 2 marks if the answer contains ‘photosynthesis’.” Or you can give a new teacher **thousands of scripts already marked** by experienced teachers, and let them pick up the patterns until they can mark new scripts similarly." },
        { type: "p", text: "Ordinary software is the first way: rules written by people. Modern AI is mostly the second way: a system adjusted, using huge numbers of examples, until it reproduces the patterns in them." },
        { type: "analogyMap", pairs: [
          { everyday: "A written marking guide", technical: "Ordinary software: rules a programmer wrote" },
          { everyday: "A teacher who learned from thousands of marked scripts", technical: "A machine-learning model: patterns learned from example data" },
          { everyday: "That teacher completing the next sentence of any essay", technical: "A [[llm|large language model]]: predicts likely next pieces of text ([[token|tokens]])" },
          { everyday: "The school that hires the teacher and adds a staffroom, timetable and rules", technical: "ChatGPT: a product built around a model, with an interface and extra features" },
        ] },
        { type: "callout", tone: "warn", title: "Where the analogy breaks", text: "A human teacher understands what they read. A language model does not understand in the human sense; it produces statistically likely text. It can be impressively right — and confidently wrong — for the same reason." },
      ],
    },
    {
      kind: "visual", mode: "experiment", title: "The core parts of an agent",
      blocks: [
        { type: "p", text: "Below is the course's **Agent Anatomy** diagram, showing only the parts you need today. Faded parts with a “?” unlock as you learn. Click at least three parts to read what each does, then press **Play** to watch a request travel through them." },
        { type: "lab", lab: "anatomy-mini", required: true, caption: "This diagram grows with you. The full version is on the Agent anatomy page." },
      ],
    },
    {
      kind: "technical", mode: "understand", title: "Model, product, agent",
      blocks: [
        { type: "p", text: "**A language model** receives text and returns text. Text is handled in small chunks called [[token|tokens]] (pieces of words). Given everything you send, it predicts a likely continuation, one token at a time. That is all it does. It does not browse the web, open files or remember yesterday unless software around it does those things and feeds the results back in as text." },
        { type: "p", text: "**ChatGPT, Claude and Gemini** are products: apps with a chat interface, conversation history, file uploads and sometimes built-in tools such as web search, wrapped around a model. When you use them, the company's software is doing the agent-like parts for you." },
        { type: "p", text: "**An agent you build** is your own software around a model. Every agent has these parts:" },
        { type: "table", head: ["Part", "What it does", "Who provides it"], rows: [
          ["User interface", "Where a person sends a request and sees results", "You"],
          ["Instructions", "Standing rules sent with every request (the system prompt)", "You"],
          ["Language model", "Proposes the next step: an answer or a tool call", "An AI provider"],
          ["Tools", "Functions the model may request: look up stock, calculate, create an order", "You"],
          ["The loop", "Calls the model, checks and runs tools, repeats, and stops", "You"],
        ] },
        { type: "callout", tone: "misconception", text: "“AI agents are a different kind of AI model.” No — agents usually use the **same** models as chatbots. What makes something an agent is the system around the model: tools plus a loop that lets it take several steps." },
        { type: "p", text: "Notice how much of that table says **You**. An AI agent engineer spends most of their time on the parts around the model." },
      ],
    },
    {
      kind: "example", mode: "understand", title: "What a model actually sends back",
      blocks: [
        { type: "p", text: "When an agent's model wants a tool, its reply is not a sentence but a small structured object. Here is the shape (simplified — each provider formats it slightly differently):" },
        { type: "code", lang: "json", code: `{
  "type": "tool_calls",
  "calls": [
    {
      "id": "call_001",
      "name": "search_products",
      "arguments": { "query": "rice" }
    }
  ]
}`, notes: [
          { line: 2, text: "The model is asking for a tool, not giving a final answer." },
          { line: 6, text: "Which tool — chosen from the list your code offered." },
          { line: 7, text: "The inputs. Your code must check these before using them." },
        ] },
        { type: "p", text: "Nothing has happened yet. Your loop now decides whether `search_products` is allowed, runs it, and sends the result back. You can see the code that does this in the **Show Me the Code** panel of the anatomy diagram's “Agent loop” part." },
      ],
    },
    {
      kind: "challenge", mode: "experiment", title: "Find who does what",
      blocks: [
        { type: "p", text: "In the diagram above, press **Play** and stop at the event where the order total is calculated. Which part is active: the language model, or a tool run by your code? Then find the event where a person is asked for approval." },
        { type: "callout", tone: "tip", text: "The challenge completes when you have inspected at least three different parts of the diagram." },
      ],
    },
    {
      kind: "failure", mode: "understand", title: "Treating the model like a person",
      blocks: [
        { type: "p", text: "A common beginner mistake is to design as if the model were an employee who remembers, checks and takes responsibility. Then the system fails in surprising ways:" },
        { type: "list", items: [
          "**It forgets.** Ask “what did I order yesterday?” — the model has no idea unless your software stored yesterday's order and sends it again.",
          "**It invents.** Ask for a price it was never given, and it may produce a believable number.",
          "**It claims actions.** It can write “Your order has been placed” even when no tool ran.",
        ] },
        { type: "callout", tone: "tip", title: "The fix", text: "Design so that facts come from tools, memory comes from storage your code controls, and actions only count when your code has actually performed them and recorded the result." },
      ],
    },
    {
      kind: "quiz", mode: "understand",
      blocks: [
        { type: "quiz", questions: [
          {
            id: "q1", type: "mcq", flavour: "recall",
            prompt: "What does a large language model do, at its core?",
            options: [
              { text: "Searches the internet for the best answer.", why: "A model on its own has no internet access. Search is a tool that software can add." },
              { text: "Predicts likely next pieces of text, given the text it receives.", why: "Correct. Everything else is built around this." },
              { text: "Looks up answers in a database of facts.", why: "It has no database of facts; it produces text from learned patterns." },
            ],
            answer: 1, hint: "Think about the exam-marking teacher completing the next sentence.",
          },
          {
            id: "q2", type: "mcq", flavour: "analogy",
            prompt: "In the marking analogy, ordinary rule-based software is most like…",
            options: [
              { text: "a written marking guide with exact rules", why: "Yes: rules written in advance by a person." },
              { text: "a teacher who learned from thousands of marked scripts", why: "That describes machine learning: patterns learned from examples." },
              { text: "the school timetable", why: "Not quite — the timetable is part of the product around the teacher." },
            ],
            answer: 0, hint: "Which one did a person write out rule by rule?",
          },
          {
            id: "q3", type: "multi", flavour: "recall",
            prompt: "Which parts of an agent does **the engineer** build? Select all that apply.",
            options: [
              { text: "The tools", why: "Yes — functions you write and choose to offer." },
              { text: "The loop that checks and runs tool calls", why: "Yes — this is the heart of your agent code." },
              { text: "The instructions (system prompt)", why: "Yes — you write them." },
              { text: "The language model itself", why: "Usually not — you rent it from an AI provider through an API." },
            ],
            answers: [0, 1, 2], hint: "Look again at the 'Who provides it' column.",
          },
          {
            id: "q4", type: "mcq", flavour: "predict",
            prompt: "A customer chatted with your agent yesterday. Today they ask “Is my order ready?” Your agent stores nothing between conversations. What happens?",
            options: [
              { text: "The model remembers yesterday's chat and answers correctly.", why: "Models do not remember between requests. Only stored data can be sent again." },
              { text: "The model has no record of the order, so it must ask — or, badly designed, it might guess.", why: "Correct. Memory has to be built by you (Module 8)." },
              { text: "The model automatically checks the shop database.", why: "Only if a tool for that exists and the loop runs it." },
            ],
            answer: 1, hint: "Where would yesterday's information be stored?",
          },
          {
            id: "q5", type: "order",
            prompt: "Put the steps of one agent cycle in order.",
            items: [
              "Your code sends instructions + conversation + tool list to the model",
              "The model replies with a proposed tool call",
              "Your code checks the call and runs the tool",
              "The tool's result is added to the conversation",
              "Your code asks the model again (or stops)",
            ],
            hint: "The model always speaks first after receiving the request; the code always acts.",
            explanation: "This cycle repeats until the model gives a final answer or a stopping rule ends it.",
          },
        ] },
      ],
    },
    {
      kind: "teachback", mode: "understand",
      blocks: [
        { type: "teachback",
          prompt: "Explain to a classmate what the difference is between “a language model”, “ChatGPT” and “an AI agent”.",
          rubric: [
            { concept: "A model predicts text", keywords: ["predict", "next word", "next token", "text in", "likely"], hint: "Say what the model itself does." },
            { concept: "ChatGPT is a product around a model", keywords: ["product", "app", "website", "interface", "built on", "around"], hint: "What does ChatGPT add?" },
            { concept: "An agent adds tools and a loop", keywords: ["tool", "loop", "repeat", "steps"], hint: "Name what turns a model into an agent." },
            { concept: "Code does the acting", keywords: ["code", "software", "program", "runs"], hint: "Who actually performs actions?" },
          ],
          exemplar: "A language model is a system trained on lots of text that predicts what text should come next. ChatGPT is a product — a website and app — built around such a model, with a chat screen and extra features. An AI agent is software someone writes around a model: it gives the model a list of tools, asks it what to do next, and then the software itself runs the tool, gives back the result, and repeats until the task is done. The model suggests; the code acts.",
        },
      ],
    },
    {
      kind: "recap", mode: "understand",
      blocks: [
        { type: "recap",
          summary: "AI models **learn patterns from examples** rather than following written rules. A **language model** predicts likely text. **ChatGPT** is a product around a model. An **agent** is your software around a model: interface, instructions, tools and a loop — where the model proposes and your code acts.",
          canNow: [
            "Explain the difference between rules and learned patterns.",
            "Name the five core parts of an agent and who builds each.",
            "Read a model's tool-call reply and say what happens next.",
          ],
          next: "Agents are powerful but not always the right choice. Next: how to decide when to use one — and what an AI agent engineer actually does all day.",
        },
      ],
    },
  ],
};

const l3: Lesson = {
  id: "m0-l3",
  moduleId: "m0",
  title: "When to use an agent — and when not to",
  subtitle: "Choosing the simplest system that does the job, and what an AI agent engineer really builds.",
  minutes: 20,
  prerequisites: ["m0-l2"],
  objectives: [
    "Place a problem on the ladder: program → one model call → workflow → agent → a person decides.",
    "Explain the costs of autonomy: money, speed, predictability and risk.",
    "Describe what an AI agent engineer builds besides prompts.",
    "Know how this course works: Understand, Experiment, Build for real.",
  ],
  glossary: ["agent", "workflow", "rule-based", "agentic", "ai-engineer", "simulation"],
  completion: [
    "Sort all eight situations correctly in the lab.",
    "Pass the knowledge check.",
    "Explain when you would NOT use an agent.",
  ],
  tutor: {
    simpler:
      "Use the simplest helper that does the job well. If the steps never change, write a normal program. If you just need language understood once, make one model call. Use an agent only when the steps depend on what you find along the way. And keep a person in charge of big or risky decisions.",
    altAnalogy:
      "You would not hire a full-time manager to switch on the shop lights every morning — a timer does it. You would not let a new assistant approve big credit for customers. Match the helper to the job.",
    misconceptions: [
      "“More autonomy is always better.” Autonomy adds cost and unpredictability. Good engineering uses the least autonomy that works.",
      "“AI engineering is mostly writing prompts.” Most of the work is tools, data, testing, safety, deployment and monitoring.",
      "“If AI can do it, it should.” Some decisions need a responsible, qualified person.",
    ],
    probingQuestions: [
      "Why is a scheduled program better than an agent for sending a weekly SMS reminder?",
      "What makes a task 'agentic' — what is it about the steps?",
      "Name two things an agent engineer builds that are not prompts.",
    ],
    revisit: ["m0-l1", "m0-l2"],
  },
  sections: [
    {
      kind: "problem", mode: "understand", title: "The shiny-tool trap",
      blocks: [
        { type: "p", text: "After seeing what agents can do, it is tempting to use one for everything. A school in Gulu asks for “an AI agent” to send fee reminders every Friday. A trader wants “an AI agent” to add up daily sales. Both would work — but both would be slower, more expensive and less predictable than a simple program." },
        { type: "callout", tone: "info", title: "The question for this lesson", text: "How do you decide what kind of system a problem actually needs?" },
      ],
    },
    {
      kind: "analogy", mode: "understand", title: "Hiring for the job",
      blocks: [
        { type: "p", text: "Mama Achen needs help. For switching on the security lights at 7 p.m., she buys a **timer**. For translating a letter from a supplier, she asks a **friend once**. For handling customer orders all day — reading messages, checking stock, quoting prices — she hires an **assistant**. For deciding whether to give a big customer credit, **she decides herself**, though the assistant may gather the numbers." },
        { type: "analogyMap", pairs: [
          { everyday: "A timer for the lights", technical: "A normal program (scheduled job, calculator)" },
          { everyday: "Asking a friend to translate once", technical: "One model call: understand or write language, no actions" },
          { everyday: "A checklist the assistant follows, using judgement at one step", technical: "A [[workflow]] with an AI step: fixed path, AI where judgement is needed" },
          { everyday: "An assistant who decides what to do next", technical: "An [[agent]]: the model chooses tools and steps in a loop" },
          { everyday: "Mama Achen deciding on credit herself", technical: "A person decides; AI may assist" },
        ] },
      ],
    },
    {
      kind: "visual", mode: "experiment", title: "Sort the situations",
      blocks: [
        { type: "p", text: "Sort each real situation onto the simplest option that would do the job well and safely." },
        { type: "lab", lab: "agent-or-not", required: true },
      ],
    },
    {
      kind: "technical", mode: "understand", title: "The autonomy ladder",
      blocks: [
        { type: "steps", items: [
          { title: "Normal program", text: "Fixed steps on predictable input. Cheapest, fastest, fully predictable. Use whenever you can." },
          { title: "One model call", text: "When you need language understood or produced — classify a message, summarise a letter — but no actions." },
          { title: "Workflow with AI steps", text: "Your code fixes the order of steps; a model is used only at the steps that need judgement. Predictable path, flexible where needed." },
          { title: "Agent", text: "The model chooses which tools to use and in what order, because the right next step depends on what was found. Most flexible; most expensive and hardest to predict." },
          { title: "A person decides", text: "High-stakes, legally sensitive or irreversible decisions. AI can prepare information; a qualified human is responsible." },
        ] },
        { type: "p", text: "Each step up the ladder buys flexibility and pays for it in **money** (more model calls), **time** (each call takes seconds), **predictability** and **risk**. A good AI engineer climbs only as high as the problem requires." },
        { type: "callout", tone: "cost", text: "An agent handling one order might make 4–6 model calls. A program makes zero. Multiply by hundreds of messages a day and the difference matters — you will calculate it precisely in Module 14." },
        { type: "p", text: "**What an AI agent engineer builds:** the tools and their data access, the loop and its stopping rules, input validation and permissions, approval steps, storage for state and memory, tests that measure whether the agent works, the user interface, deployment, monitoring and cost controls. The prompt is one small piece." },
      ],
    },
    {
      kind: "example", mode: "understand", title: "How this course is built",
      blocks: [
        { type: "p", text: "Every lesson follows the same path, from familiar to technical. You will see three kinds of activity, marked at the top of each section:" },
        { type: "table", head: ["Mode", "What you do", "Needs code?"], rows: [
          ["**Understand**", "Analogies, diagrams, explanations, questions", "No"],
          ["**Experiment**", "Change inputs, step through systems, break things on purpose", "No"],
          ["**Build for real**", "Write and run real JavaScript; later connect real models and deploy", "Yes (from Module 2)"],
        ] },
        { type: "callout", tone: "sim", text: "Labs use **simulations** so you can learn for free and offline. They are always labelled. The simulated model is a rule program that returns responses in the same format as a real model — so the agent code around it is real, and you can swap in a live model later." },
        { type: "p", text: "By the end you will build the **Kampala Market Assistant**: a deployed agent that reads customer requests, checks stock, prepares quotations in UGX, asks the owner for approval and records orders — with tests, logs and cost controls." },
      ],
    },
    {
      kind: "challenge", mode: "experiment", title: "Defend your sorting",
      blocks: [
        { type: "p", text: "Complete the sorting lab until all eight are correct. For the two situations you found hardest, write one sentence each (for yourself) explaining why the simpler option is better — or why a person must decide." },
      ],
    },
    {
      kind: "failure", mode: "understand", title: "Too much autonomy",
      blocks: [
        { type: "p", text: "Real failures from using more autonomy than needed:" },
        { type: "list", items: [
          "**Unpredictable reminders:** an agent writing each fee reminder freshly sometimes changes amounts or dates. A template program would never do that.",
          "**Runaway bills:** an agent stuck repeating a step can make hundreds of paid model calls before anyone notices (Module 7 shows how to stop this).",
          "**Unaccountable decisions:** an automated loan refusal with no responsible person and no explanation harms people and may break regulations.",
        ] },
        { type: "callout", tone: "tip", text: "Ask: what is the worst thing that happens if this system makes a mistake, and who will notice? The higher the stakes, the more you want fixed rules, approvals and a human decision." },
      ],
    },
    {
      kind: "quiz", mode: "understand",
      blocks: [
        { type: "quiz", questions: [
          {
            id: "q1", type: "mcq", flavour: "design",
            prompt: "A SACCO wants to send each member their monthly balance by SMS, using numbers already in its database. What should it build?",
            options: [
              { text: "An agent, so messages sound natural", why: "Natural wording is not worth the risk of a wrong number, extra cost or unpredictability." },
              { text: "A scheduled program filling in a fixed message template", why: "Correct: structured data, fixed steps, must be exact." },
              { text: "One model call per member to write the message", why: "Adds cost and the risk of altered numbers for no real benefit." },
            ],
            answer: 1, hint: "Is anything about the steps unpredictable?",
          },
          {
            id: "q2", type: "mcq", flavour: "recall",
            prompt: "What makes a task genuinely **agentic**?",
            options: [
              { text: "It involves language.", why: "Language alone needs only a model call." },
              { text: "The right next step depends on what earlier steps found.", why: "Yes — the model must choose steps based on results." },
              { text: "It is important.", why: "Importance argues for human oversight, not autonomy." },
            ],
            answer: 1, hint: "Think about why the order assistant cannot follow a fixed path.",
          },
          {
            id: "q3", type: "multi", flavour: "recall",
            prompt: "Moving up the autonomy ladder usually increases… (select all)",
            options: [
              { text: "Cost per task", why: "Yes — more model calls." },
              { text: "Flexibility with messy situations", why: "Yes — that is the benefit." },
              { text: "Predictability", why: "No — predictability usually goes down." },
              { text: "Time per task", why: "Yes — each model call takes time." },
            ],
            answers: [0, 1, 3], hint: "What do you pay, and what do you get?",
          },
          {
            id: "q4", type: "mcq", flavour: "recall",
            prompt: "Which is **not** typically a large part of an AI agent engineer's work?",
            options: [
              { text: "Writing tools and validating their inputs", why: "It is a large part." },
              { text: "Training a brand-new language model from scratch", why: "Correct — agent engineers usually use existing models from providers." },
              { text: "Testing, deployment and monitoring", why: "It is a large part." },
            ],
            answer: 1, hint: "Who usually builds the model itself?",
          },
          {
            id: "q5", type: "short",
            prompt: "Describe one task in your community that would genuinely benefit from an agent, and one that should stay a simple program. Why?",
            modelAnswer: "An agent could help a hardware shop answer WhatsApp enquiries: messages vary, and it must check stock and prices before replying, then ask the owner before confirming. A simple program should handle the daily sales total, because the inputs are structured and the arithmetic must be exact.",
            checklist: ["Your agent example has steps that depend on what is found", "Your program example has predictable, structured input", "You considered cost or risk"],
          },
        ] },
      ],
    },
    {
      kind: "teachback", mode: "understand",
      blocks: [
        { type: "teachback",
          prompt: "A business owner says: “I want an AI agent for everything in my shop.” Explain kindly how you would decide which jobs need an agent, which need something simpler, and which need a person.",
          rubric: [
            { concept: "Prefer the simplest option", keywords: ["simple", "simplest", "program", "rules", "cheaper"], hint: "Mention starting simple." },
            { concept: "Agents for steps that depend on results", keywords: ["depend", "decide", "next step", "messy", "varied", "check"], hint: "When is an agent worth it?" },
            { concept: "Costs and risks of autonomy", keywords: ["cost", "expensive", "slow", "predict", "risk", "mistake"], hint: "What does autonomy cost?" },
            { concept: "Humans for high-stakes decisions", keywords: ["person", "human", "owner", "approve", "decide", "responsib"], hint: "Who decides the big things?" },
          ],
          exemplar: "I would look at each job and use the simplest thing that works. If the steps are always the same and the data is structured — like totalling sales or sending weekly reminders — a normal program is cheaper, faster and never makes things up. If a job only needs language understood once, like summarising a supplier's letter, one model call is enough. An agent is worth it when the next step depends on what you find, like answering customer messages by checking stock and prices. And for big decisions like giving credit, you stay in charge — the AI can gather information, but you approve.",
        },
      ],
    },
    {
      kind: "recap", mode: "understand",
      blocks: [
        { type: "recap",
          summary: "Choose the **least autonomy that does the job**: program → one model call → workflow with AI steps → agent → a person decides. Autonomy buys flexibility and costs money, time, predictability and risk. AI agent engineers mostly build the **system around the model**: tools, loops, safety, data, tests, interfaces and deployment.",
          canNow: [
            "Decide whether a problem needs a program, a model call, a workflow, an agent or a person.",
            "Explain the trade-offs of autonomy.",
            "Describe what you will be able to build by the end of this course.",
          ],
          next: "Module 1 starts from the ground up: how computers and the internet move a message from a phone to a server and back — the foundation every agent runs on.",
        },
      ],
    },
  ],
};

export const m00Lessons: Lesson[] = [l1, l2, l3];
