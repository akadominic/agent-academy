import type { Lesson } from "../schema";

/* ======================================================================
   MODULE 1 — How Computers and the Internet Work
   From one phone on its own, to a phone talking to a server, to the
   internet in between, to the cloud and databases behind it all.
   ====================================================================== */

/* ---------------------------------------------------------------------- */
/*  Lesson 1: Hardware, software, files and operating systems              */
/* ---------------------------------------------------------------------- */

const l1: Lesson = {
  id: "m1-l1",
  moduleId: "m1",
  title: "Inside one computer",
  subtitle: "Hardware, software, files, folders and the operating system: what happens when you open an app on your phone.",
  minutes: 25,
  prerequisites: ["m0-l1"],
  objectives: [
    "Tell **hardware** from **software**, with examples from your own phone.",
    "Explain what the **CPU**, **memory** and **storage** each do, and why a computer needs all three.",
    "Explain what **files**, **folders** and **file paths** are, and that every file is stored as numbers.",
    "Describe what an **operating system** does and how an **app** is started.",
    "Explain **local execution**: why some apps keep working with no internet.",
  ],
  glossary: ["computer", "hardware", "software", "cpu", "memory", "storage", "file", "folder", "file-path", "byte", "operating-system", "program", "app", "local-execution"],
  completion: [
    "In the trace lab, run the calculator app and the shop website with airplane mode ON.",
    "Pass the knowledge check (you can retry).",
    "Explain in your own words what happens inside a phone when you open an app.",
  ],
  tutor: {
    simpler:
      "A phone has physical parts (hardware) and instructions (software). The instructions are kept as files in storage. When you open an app, the operating system copies those instructions into memory and the CPU follows them, one tiny step at a time. A calculator does all of this inside the phone, so it works in airplane mode.",
    altAnalogy:
      "A school: the buildings, desks and blackboards are hardware. The timetable and lesson plans are software. The head teacher is the operating system, deciding which class uses which room. The filing cabinet is storage, and the desk where a teacher spreads out today's papers is memory.",
    misconceptions: [
      "“Memory and storage are the same thing.” Storage keeps files when the power is off; memory (RAM) is fast working space that is wiped when the power goes off. A phone advertised as “128 GB” is talking about storage.",
      "“Apps are not files.” An app is a program, and a program is stored as files, just like photos and documents. It is only special because the operating system can run it.",
      "“Everything on my phone needs the internet.” Many apps, such as the calculator, camera and torch, run entirely on the phone. Only apps that need data or work from another computer need a connection.",
      "“The operating system is an app.” The OS is the software underneath all apps. Apps ask the OS for everything: the screen, files, the network.",
    ],
    probingQuestions: [
      "If you switch your phone off and on again, what is lost: things in memory or things in storage? Why?",
      "Which apps on your phone still work in airplane mode? What do they have in common?",
      "A file called `prices.txt` contains the bytes 114, 105, 99, 101. Where did those numbers come from?",
    ],
  },
  sections: [
    /* A. THE PROBLEM */
    {
      kind: "problem",
      mode: "understand",
      title: "Why does the calculator work, but not WhatsApp?",
      blocks: [
        { type: "p", text: "Brian is travelling from Kampala to Gulu by bus. Somewhere after Karuma the network disappears. He opens WhatsApp: the message to his sister just sits there with a little clock. He opens the calculator to check his money: it works perfectly. He takes a photo of the Nile: that works too." },
        { type: "p", text: "Same phone, same moment, no network. Why do some apps keep working and others stop?" },
        { type: "p", text: "To answer this, and to build AI agents later, you need a clear picture of what is inside one computer and what an app actually **is**. Every system you will build in this course, however clever, is made of these same few parts." },
        { type: "callout", tone: "info", title: "The question for this lesson", text: "What are the parts inside a computer, how does an app run on them, and what can a program do without any other computer's help?" },
      ],
    },

    /* B. THE ANALOGY */
    {
      kind: "analogy",
      mode: "understand",
      title: "A market stall with a stockroom",
      blocks: [
        { type: "p", text: "Picture Mama Achen's stall in Nakawa market." },
        { type: "steps", items: [
          { title: "The building, counter, shelves and till are the physical things.", text: "You can touch them. Without them nothing can happen, but on their own they do nothing either." },
          { title: "The way the shop is run is the instructions.", text: "How to serve a customer, how to record a sale, when to restock. You cannot touch “how to record a sale”, but it is what makes the stall useful." },
          { title: "The stockroom behind the stall keeps everything safely, even overnight.", text: "It holds a lot, but walking back there takes time." },
          { title: "The counter is where today's work is spread out.", text: "Quick to reach, but small, and it is cleared every evening when the stall closes." },
          { title: "The shop assistant does each task, one at a time, very fast.", text: "Takes a sack from the counter, weighs it, adds up the bill." },
          { title: "Mama Achen manages everything.", text: "She decides who uses the counter, keeps the stockroom organised, and makes sure two assistants don't grab the same sack." },
        ] },
        { type: "analogyMap", title: "From the market stall to a computer", pairs: [
          { everyday: "The building, counter, shelves, till", technical: "[[hardware|Hardware]]: the physical parts of the computer" },
          { everyday: "The way the shop is run", technical: "[[software|Software]]: instructions written by people" },
          { everyday: "The stockroom", technical: "[[storage|Storage]]: keeps [[file|files]] even when the power is off" },
          { everyday: "The counter", technical: "[[memory|Memory (RAM)]]: fast, small, cleared when the power goes off" },
          { everyday: "The assistant doing each task", technical: "The [[cpu|CPU]]: carries out instructions one step at a time" },
          { everyday: "Mama Achen, the manager", technical: "The [[operating-system|operating system]]: manages hardware and runs every app" },
          { everyday: "Labelled shelves and boxes in the stockroom", technical: "[[folder|Folders]] that organise files" },
        ] },
        { type: "callout", tone: "warn", title: "Where the analogy breaks", text: "A shop assistant can think and improvise. A CPU cannot. It does exactly what the instructions say, billions of times per second, and never wonders whether the instructions make sense. Also, a real stockroom holds sacks of rice; a computer's storage holds only **numbers**. Photos, songs and apps are all numbers in the end." },
      ],
    },

    /* C. THE VISUALISATION */
    {
      kind: "visual",
      mode: "experiment",
      title: "Watch an app run, then switch off the network",
      blocks: [
        { type: "p", text: "The lab opens on **Calculator app (local)**. Press **Step** to follow your tap from the touchscreen, through the operating system, into storage, memory and the CPU, and back to the screen. Watch the inspector: it shows what happens at each part." },
        { type: "p", text: "Then switch on **Airplane mode** and run it again. Finally, switch to **Shop website (remote)**, keep airplane mode on, and run that too. Compare where each trip ends." },
        { type: "lab", lab: "internet-trace", props: { scenario: "local", challenge: "airplane" }, required: true, caption: "The challenge completes when you have run both trips, all the way to their last step, with airplane mode on." },
        { type: "callout", tone: "sim", text: "This is a simplified, scripted model of a phone. Real phones do the same kinds of steps (input, OS, storage, memory, CPU, display), but with millions more details. The file path shown is illustrative; Android and iOS store apps in their own protected folders." },
      ],
    },

    /* D. THE TECHNICAL EXPLANATION */
    {
      kind: "technical",
      mode: "understand",
      title: "What is really inside",
      blocks: [
        { type: "p", text: "Every [[computer|computer]], whether a laptop, a phone, a smart TV or a server in a data centre, has the same basic parts." },
        { type: "table", caption: "The main hardware parts", head: ["Part", "What it does", "On a typical phone (illustrative)"], rows: [
          ["**CPU** (processor)", "Carries out instructions: add, compare, copy, jump to another instruction", "One chip with several “cores” working side by side"],
          ["**Memory** (RAM)", "Holds running programs and their data. Very fast. Emptied when power goes off", "4–12 GB"],
          ["**Storage**", "Keeps files permanently. Slower than memory, but much bigger", "64–512 GB"],
          ["**Input/output**", "Touchscreen, display, camera, microphone, speaker, radios (Wi-Fi, mobile data, Bluetooth)", "—"],
        ] },
        { type: "p", text: "[[software|Software]] is the instructions. A [[program|program]] is one set of instructions that does a job. An [[app|app]] (short for application) is a program made for people to use directly: WhatsApp, a calculator, a web browser." },
        { type: "p", text: "The [[operating-system|operating system]] (OS) is the most important program on the machine. Android and iOS run phones; Windows, macOS and Linux run laptops and servers. The OS starts first when you switch on, and it:" },
        { type: "list", items: [
          "starts and stops apps, and shares the CPU and memory between them;",
          "organises storage into **files** and **folders**;",
          "controls the hardware, so apps ask the OS to draw on the screen or send data over the network;",
          "keeps apps apart, so a broken game cannot read your mobile money app's data.",
        ] },
        { type: "p", text: "A [[file|file]] is a named piece of stored data. Inside, it is just a list of [[byte|bytes]]: numbers from 0 to 255. What those numbers mean depends on the type of file: in a text file, each number stands for a letter (114 means “r”); in a photo, numbers describe the colour of each dot. Files live in [[folder|folders]], and folders can hold other folders, forming a tree. The route through the tree to a file is its [[file-path|file path]], such as `Documents/shop/prices.txt`." },
        { type: "p", text: "**How an app starts.** When you tap an icon, the OS finds the app's program files in storage, copies the instructions into memory, and tells the CPU to start following them. The app then asks the OS for whatever it needs: draw this button, read that file, send this message." },
        { type: "callout", tone: "tip", title: "Local execution", text: "When a program runs on the device in your hand, using that device's own CPU, memory and storage, we call it [[local-execution|local execution]]. A calculator is fully local: it needs nothing from any other computer, so it works in airplane mode. WhatsApp's interface also runs locally, but **delivering a message** needs WhatsApp's servers, which are other computers far away. That part needs the network. The next lesson is about those other computers." },
        { type: "callout", tone: "misconception", text: "“My phone has 128 GB of memory.” That number is almost always **storage**. Memory (RAM) is much smaller, usually a few gigabytes. Running many apps fills memory; saving many photos fills storage." },
      ],
    },

    /* E. THE WORKING EXAMPLE */
    {
      kind: "example",
      mode: "understand",
      title: "A real file, down to its numbers",
      blocks: [
        { type: "p", text: "Programmers often work with files using a **terminal**: a window where you type commands instead of tapping icons. You will learn the terminal properly in Module 2. For now, just read what each command does. These commands work in the terminal on macOS and Linux." },
        { type: "code", lang: "bash", code: `mkdir shop
cd shop
echo "rice,110000" > prices.txt
ls -l
cat prices.txt
od -An -tu1 prices.txt`, notes: [
          { line: 1, text: "**m**a**k**e a **dir**ectory (folder) called `shop`." },
          { line: 2, text: "**c**hange **d**irectory: go into the `shop` folder." },
          { line: 3, text: "Create a file called `prices.txt` containing the text `rice,110000`." },
          { line: 4, text: "**L**i**s**t the files in this folder, with details such as size." },
          { line: 5, text: "Show what is inside the file, as text." },
          { line: 6, text: "Show the same file as raw bytes: the numbers actually stored." },
        ] },
        { type: "p", text: "Here is the output we got when we ran them (we changed the user name; your name, date and spacing will be different):" },
        { type: "code", lang: "text", caption: "Output (lightly trimmed)", code: `-rw-r--r-- 1 achen staff 12 Nov  4 10:32 prices.txt
rice,110000
 114 105  99 101  44  49  49  48  48  48  48  10` },
        { type: "table", caption: "Each byte is the code for one character", head: ["Byte", "114", "105", "99", "101", "44", "49", "48", "10"], rows: [
          ["Character", "r", "i", "c", "e", ",", "1", "0", "new line"],
        ] },
        { type: "p", text: "The file is **12 bytes**: 11 characters plus an invisible “new line” character (10) that `echo` adds at the end. A photo is the same idea, just millions of bytes long, and the numbers mean colours instead of letters." },
        { type: "callout", tone: "info", title: "On Windows", text: "In PowerShell you can use `mkdir shop`, `cd shop`, `dir` (list) and `type prices.txt` (show). `Format-Hex prices.txt` shows the bytes, but in hexadecimal (base 16), so “r” appears as 72. Windows usually ends lines with two bytes, 13 and 10, instead of just 10." },
      ],
    },

    /* F. THE INTERACTIVE CHALLENGE */
    {
      kind: "challenge",
      mode: "experiment",
      title: "Predict, then test, in airplane mode",
      blocks: [
        { type: "p", text: "Before you run anything in the lab above, write down your predictions:" },
        { type: "list", ordered: true, items: [
          "With airplane mode on, at which step will the **calculator** trip stop? (Or will it finish?)",
          "With airplane mode on, at which step will the **shop website** trip stop?",
          "In the calculator trip, which step writes something that will still be there tomorrow?",
        ] },
        { type: "p", text: "Now run both trips in the lab with airplane mode on, all the way to the last step. Were you right? For the website, look at which part is marked with the red cross: is the problem on the phone or somewhere else?" },
        { type: "callout", tone: "tip", text: "The lab marks this challenge complete once both trips have been run to the end in airplane mode." },
      ],
    },

    /* G. WHAT CAN GO WRONG */
    {
      kind: "failure",
      mode: "experiment",
      title: "“Storage full” and the vanishing work",
      blocks: [
        { type: "p", text: "Two everyday failures come straight from the difference between memory and storage." },
        { type: "steps", items: [
          { title: "Failure 1: “Storage full”. The phone refuses to save a photo or install an update.", text: "**Recognise it:** an error such as “Storage space running out” or an app that fails to update. **Explain it:** storage is where files live, and it has a fixed size. Videos, voice notes and downloaded WhatsApp media fill it up. **Fix it:** delete or move large files (Settings → Storage shows what is using the space), or move them to a memory card or a cloud backup." },
          { title: "Failure 2: Work that was never saved disappears.", text: "**Recognise it:** you were typing a long message or document, the battery died, and when the phone restarts the text is gone. **Explain it:** what you typed was only in **memory**, and memory is wiped when power goes off. It only survives if the app wrote it to a **file** in storage. **Fix it:** save often; good apps save drafts automatically for exactly this reason." },
        ] },
        { type: "callout", tone: "warn", title: "Why this matters for agents", text: "AI agents have the same problem. Whatever an agent “remembers” while it runs lives in memory. If the program crashes or restarts, it is gone, unless your code saved it to storage or a database. Module 9 is all about agent memory, and it builds on exactly this idea." },
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
            prompt: "Which of these is **hardware**?",
            options: [
              { text: "The Android operating system", why: "Android is software: instructions. You cannot touch it." },
              { text: "The phone's storage chip", why: "Correct. It is a physical part that keeps files." },
              { text: "The WhatsApp app", why: "An app is a program, which is software." },
              { text: "A photo file", why: "A file is data stored as bytes. It lives on hardware but is not hardware itself." },
            ],
            answer: 1,
            hint: "Hardware is something you could, in principle, hold in your hand.",
          },
          {
            id: "q2", type: "mcq", flavour: "predict",
            prompt: "You are typing a long message. Before you press send, the battery dies. You charge the phone and open the app. What happens to the unsent text?",
            options: [
              { text: "It is always still there, because phones keep everything.", why: "Only things written to storage survive a power cut." },
              { text: "It is gone, unless the app had already saved a draft to storage.", why: "Correct. Text you are typing lives in memory, which is wiped when power goes off." },
              { text: "It was sent automatically before the battery died.", why: "Sending needs the app to do it and the network to work. Nothing was sent." },
            ],
            answer: 1,
            hint: "Was the text in memory or in storage?",
          },
          {
            id: "q3", type: "multi", flavour: "recall",
            prompt: "Which jobs does the **operating system** do? Select all that apply.",
            options: [
              { text: "Starts apps and shares the CPU and memory between them", why: "Yes. This is one of its main jobs." },
              { text: "Organises storage into files and folders", why: "Yes. Apps ask the OS to read and write files." },
              { text: "Decides what your WhatsApp messages say", why: "No. You write the messages; WhatsApp and its servers deliver them." },
              { text: "Keeps apps apart so one cannot read another's private data", why: "Yes. This protection is a key job of the OS." },
            ],
            answers: [0, 1, 3],
            hint: "Think of Mama Achen as manager of the stall: what does a manager do?",
          },
          {
            id: "q4", type: "mcq", flavour: "debug",
            prompt: "Grace's phone says “Storage full” when she tries to take a photo. Her friend says: “Close some apps to free up memory.” Will that fix it?",
            options: [
              { text: "Yes, closing apps frees up space for photos.", why: "Closing apps frees memory (RAM), but photos are saved to storage." },
              { text: "No. Photos are saved as files in storage. She needs to delete or move files.", why: "Correct. Memory and storage are different. The error is about storage." },
              { text: "No. She needs a faster CPU.", why: "The CPU's speed has nothing to do with how much can be stored." },
            ],
            answer: 1,
            hint: "Where does a photo go when it is saved?",
          },
          {
            id: "q5", type: "mcq", flavour: "analogy",
            prompt: "In the market-stall analogy, the counter is memory and the stockroom is storage. Which situation matches **loading an app**?",
            options: [
              { text: "Bringing a sack from the stockroom to the counter so the assistant can work with it", why: "Correct. The OS copies the program from storage into memory, where the CPU can use it quickly." },
              { text: "Locking the stockroom at night", why: "That is closer to switching off or protecting storage." },
              { text: "Writing a sale in the stock book", why: "That is more like saving a file: memory → storage." },
            ],
            answer: 0,
            hint: "Starting an app moves its instructions from the slow, big place to the fast, small place.",
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
          prompt: "Your younger brother asks: “Why does the calculator work on the bus with no network, but WhatsApp messages don't send?” Explain what happens inside the phone when he opens the calculator, and why WhatsApp is different.",
          rubric: [
            { concept: "The app is stored as files and loaded into memory", keywords: ["storage", "file", "memory", "ram", "load"], hint: "Where is the app kept, and where does it go when it runs?" },
            { concept: "The CPU runs the instructions", keywords: ["cpu", "processor", "instructions", "runs", "executes"], hint: "Which part actually does the calculation?" },
            { concept: "The operating system manages it", keywords: ["operating system", "os", "android", "ios"], hint: "Who starts the app and gives it the screen?" },
            { concept: "Local vs needing another computer", keywords: ["local", "inside the phone", "on the phone", "server", "another computer", "network", "internet"], hint: "What does WhatsApp need that the calculator doesn't?" },
          ],
          exemplar: "The calculator is a program saved as files in the phone's storage. When you tap it, the operating system (Android) copies it into memory and the CPU follows its instructions, so it can work out 12,500 × 3 by itself. Everything happens inside the phone: that is local execution, so it works with no network. WhatsApp also runs on the phone, but to deliver a message it has to send it to WhatsApp's servers, which are other computers far away. With no network the message can't leave the phone, so it waits with a little clock.",
        },
      ],
    },

    /* J. RECAP */
    {
      kind: "recap",
      mode: "understand",
      blocks: [
        { type: "recap",
          summary: "**Hardware** is the physical machine; **software** is the instructions. The **CPU** follows instructions, **memory** is fast temporary working space, and **storage** keeps **files** in **folders** even with the power off. Every file is stored as numbers (bytes). The **operating system** manages it all and starts **apps** by loading them from storage into memory. A program running on your own device is **local execution**: it needs no other computer.",
          canNow: [
            "Name the main parts of a computer and say what each does.",
            "Explain the difference between memory and storage, and predict what survives a power cut.",
            "Explain what files, folders and file paths are.",
            "Explain why some apps work offline and others don't.",
          ],
          next: "Next: what happens when an app needs **another** computer. You will meet clients and servers, and the frontend and backend of a website.",
        },
      ],
    },
  ],
};

/* ---------------------------------------------------------------------- */
/*  Lesson 2: Clients and servers, browsers, frontends, backends           */
/* ---------------------------------------------------------------------- */

const l2: Lesson = {
  id: "m1-l2",
  moduleId: "m1",
  title: "Clients and servers",
  subtitle: "Browsers, frontends and backends: how one program asks another program, on another computer, for help.",
  minutes: 30,
  prerequisites: ["m1-l1"],
  objectives: [
    "Explain what a **client** and a **server** are, using the restaurant analogy.",
    "Describe what a **browser** does.",
    "Tell the **frontend** from the **backend** of a website, and say what belongs in each.",
    "Explain why secrets and business rules must stay in the backend.",
    "Assemble a working website architecture from its parts.",
  ],
  glossary: ["client", "server", "browser", "frontend", "backend", "html", "javascript", "database", "remote-execution", "http-request", "http-response"],
  completion: [
    "Assemble a working website in the website assembler and send a request through it.",
    "Pass the knowledge check (you can retry).",
    "Explain the difference between a frontend and a backend in your own words.",
  ],
  tutor: {
    simpler:
      "A client asks; a server answers. Your browser is a client. When you open a shop's website, the browser asks the shop's server for the page. The page you see and tap is the frontend. The code on the server that checks prices and saves orders is the backend. Customers never see the backend, and that is exactly where secrets belong.",
    altAnalogy:
      "Mobile money: you (the client) type *165# and send a request. MTN's computers (the server) check your balance, apply the rules, update the records and send back a reply. The menu you see on your phone is the frontend; the system that actually moves the money is the backend.",
    misconceptions: [
      "“A server is a special, giant kind of computer.” Any computer can be a server. “Server” describes the job: waiting for requests and answering them. Your own laptop can run a server, as you will see in this lesson's example.",
      "“The website lives in my browser.” The browser only shows a copy of the frontend it downloaded. The data and the backend stay on the server.",
      "“Frontend means design, backend means code.” Both are code. The difference is **where** it runs: the frontend runs on the user's device; the backend runs on the server.",
      "“If I hide a password in the frontend code, users can't see it.” Anything sent to the browser can be read by the user. Secrets belong only in the backend.",
    ],
    probingQuestions: [
      "When you check your balance on *165#, which part is the client and which is the server?",
      "Why can't a shop put its database password in the frontend code?",
      "Could your laptop be a server? What would it need to do?",
    ],
    revisit: ["m1-l1"],
  },
  sections: [
    /* A. THE PROBLEM */
    {
      kind: "problem",
      mode: "understand",
      title: "One stock book, a hundred customers",
      blocks: [
        { type: "p", text: "Mama Achen wants customers to check prices and order from their phones, any time, without phoning her. She has one stock book, and it must stay correct: if two customers buy the last bag of rice at the same moment, only one of them can get it." },
        { type: "p", text: "She cannot put a copy of her stock book on every customer's phone. Copies would go out of date within an hour, and anyone could change their copy to say rice costs UGX 10." },
        { type: "p", text: "So there must be **one** place that holds the real stock book and makes the decisions, and many phones that **ask** it. How does that work?" },
        { type: "callout", tone: "info", title: "The question for this lesson", text: "How do programs on different computers work together, and which part of a website does what?" },
      ],
    },

    /* B. THE ANALOGY */
    {
      kind: "analogy",
      mode: "understand",
      title: "A restaurant taking an order",
      blocks: [
        { type: "p", text: "Think of a busy restaurant in Kampala." },
        { type: "steps", items: [
          { title: "You sit at a table and read the menu.", text: "The menu and dining room are designed for you: easy to read, nice to look at." },
          { title: "You tell the waiter what you want.", text: "You don't walk into the kitchen. You make a **request**, in a format the restaurant understands." },
          { title: "The kitchen prepares the order.", text: "The cooks follow the restaurant's recipes and rules, take ingredients from the stockroom and decide what can be served. You never see this part." },
          { title: "The waiter brings back your food, or bad news.", text: "“Here is your rolex,” or “Sorry, we have run out of chapati.” That is the **response**." },
          { title: "One kitchen serves many tables.", text: "Dozens of customers order at once, but there is one kitchen and one stockroom, so the count of chapatis stays correct." },
        ] },
        { type: "analogyMap", title: "From the restaurant to a website", pairs: [
          { everyday: "The customer at the table", technical: "The [[client|client]]: your phone and its [[browser|browser]]" },
          { everyday: "The menu and dining room", technical: "The [[frontend|frontend]]: pages and buttons that run in the browser" },
          { everyday: "Giving your order to the waiter", technical: "An [[http-request|HTTP request]] sent over the network" },
          { everyday: "The kitchen", technical: "The [[backend|backend]]: code on the [[server|server]] that applies the rules" },
          { everyday: "The stockroom", technical: "The [[database|database]]: where data is kept (Lesson 4)" },
          { everyday: "The food or the apology", technical: "An [[http-response|HTTP response]]" },
        ] },
        { type: "callout", tone: "warn", title: "Where the analogy breaks", text: "A waiter can explain, persuade and improvise. Computers exchange messages in strict formats. If a request is even slightly wrong, the server does not guess what you meant; it replies with an error. Also, a real restaurant's menu is printed once; a website's frontend is downloaded fresh from the server, so it can change every day." },
      ],
    },

    /* C. THE VISUALISATION */
    {
      kind: "visual",
      mode: "experiment",
      title: "Follow one request from phone to server and back",
      blocks: [
        { type: "p", text: "Here is a real-shaped trip from a customer's phone to Mama Achen's server. Press **Play** and watch the **phone** (client) send a request, the **server** run its backend code, ask the **database**, and send a response back. Ignore the DNS and internet steps for now; they are the next lesson." },
        { type: "lab", lab: "internet-trace", caption: "Focus on the phone, server and database. You can also try “Server down” to see what a client experiences when its server disappears." },
        { type: "callout", tone: "sim", text: "The shop, its address (`shop.mamaachen.example`) and its server are made up for teaching. The `.example` ending is reserved so it can never be a real website. The formats of the messages you see are real." },
      ],
    },

    /* D. THE TECHNICAL EXPLANATION */
    {
      kind: "technical",
      mode: "understand",
      title: "Clients, servers, frontends and backends",
      blocks: [
        { type: "p", text: "A [[client|client]] is a program that sends requests. A [[server|server]] is a program that waits for requests and sends back responses. They are usually on different computers, connected by a network. “Server” is also used for the computer that runs the server program; context makes it clear." },
        { type: "p", text: "When a program runs on another computer and you use it by sending requests, that is [[remote-execution|remote execution]], the opposite of the local execution you saw in Lesson 1." },
        { type: "p", text: "A [[browser|browser]] (Chrome, Safari, Firefox, Opera Mini) is a general-purpose client. It can talk to any web server, and it can display what comes back. Many apps on your phone are clients too: WhatsApp, the MTN MoMo app and Jumia's app each talk to their own company's servers." },
        { type: "p", text: "A website or app has two halves:" },
        { type: "compare",
          left: { title: "Frontend (runs on the user's device)", items: [
            "What the user sees and touches: pages, buttons, forms",
            "On the web: [[html|HTML]] (content), CSS (style) and [[javascript|JavaScript]] (behaviour)",
            "Downloaded from the server, then runs inside the browser",
            "Anyone can read it: right-click → “View page source”",
            "Must **never** contain passwords or secret keys",
          ] },
          right: { title: "Backend (runs on the server)", items: [
            "Receives requests and decides what to send back",
            "Applies the business rules: prices, stock, who may do what",
            "Talks to the database and to other services",
            "Users cannot see or change its code",
            "The only safe place for secrets, such as a database password or an AI API key",
          ] },
        },
        { type: "callout", tone: "warn", title: "Never trust the client", text: "Because the frontend runs on the user's device, the user controls it. They can change prices on their own screen, or send requests by hand. So the backend must check everything itself: is this product real, is it in stock, is this the right price? This rule will matter a great deal when you build agents: the code that runs tools must check every request, wherever it came from." },
        { type: "p", text: "**Where agents fit.** An AI agent you build in this course is mostly backend code: it runs on a server, keeps the API key secret, calls the AI model and runs tools. A chat page in the browser is its frontend." },
      ],
    },

    /* E. THE WORKING EXAMPLE */
    {
      kind: "example",
      mode: "build",
      title: "A complete frontend and backend in 35 lines",
      blocks: [
        { type: "p", text: "This is a real, working web server written in JavaScript for **Node.js** (a program that runs JavaScript outside a browser; you will install it in Module 2). It contains both halves: the backend (the request handler) and the frontend (the page it sends to the browser). Read the notes; you are not expected to write this yet." },
        { type: "code", lang: "js", caption: "server.js — run with: node server.js", code: `const http = require("node:http");

const products = [
  { name: "Rice (25 kg bag)", priceUGX: 110000 },
  { name: "Sugar (1 kg)", priceUGX: 5500 },
];

const page = \`<!doctype html>
<h1>Mama Achen's Shop</h1>
<button id="load">Show prices</button>
<ul id="list"></ul>
<script>
  document.getElementById("load").onclick = async () => {
    const response = await fetch("/products");
    const items = await response.json();
    document.getElementById("list").innerHTML = items
      .map((p) => "<li>" + p.name + ": UGX " + p.priceUGX + "</li>")
      .join("");
  };
</script>\`;

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(page);
  } else if (req.method === "GET" && req.url === "/products") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(products));
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  }
});

server.listen(3000, () => console.log("Open http://localhost:3000"));`, notes: [
          { line: 1, text: "Load Node's built-in `http` module: ready-made code for being an HTTP server." },
          { line: 3, text: "The shop's data. It lives on the server. A real shop would keep it in a database (Lesson 4)." },
          { line: 8, text: "**The frontend**: a small HTML page with a button and a list. The server sends this text to the browser, and the browser runs it." },
          { line: 14, text: "This frontend JavaScript runs **in the browser**. When the button is clicked, it sends a second request, to `/products`." },
          { line: 22, text: "**The backend**: this function runs on the server once for every request that arrives." },
          { line: 23, text: "A request for `/` gets the frontend page." },
          { line: 26, text: "A request for `/products` gets the data, as JSON (a text format for data you will meet in Module 2)." },
          { line: 29, text: "Anything else gets status 404: “Not found”." },
          { line: 35, text: "Start listening for requests on port 3000 of this computer." },
        ] },
        { type: "p", text: "If you run this on a laptop and open `http://localhost:3000` in its browser, your laptop is **both** the client (the browser) and the server (Node). `localhost` means “this same computer”. Click **Show prices** and the frontend fetches the data from the backend. Notice that the client and server are separate programs even when they share one machine." },
        { type: "callout", tone: "tip", text: "We tested this exact file with Node.js 22. You will run it yourself once you have Node installed in Module 2." },
      ],
    },

    /* F. THE INTERACTIVE CHALLENGE */
    {
      kind: "challenge",
      mode: "experiment",
      title: "Assemble a website",
      blocks: [
        { type: "p", text: "Put each piece where it belongs, then press **Send a request**. If you get it wrong, the request breaks at the first wrong slot and tells you why. Two of the pieces are traps: they don't belong anywhere." },
        { type: "lab", lab: "website-assembler", required: true, caption: "Complete when a request travels all the way through your assembly and the page appears." },
        { type: "callout", tone: "tip", text: "Getting it wrong is useful here. Try putting the backend inside the browser on purpose and read the explanation. It is one of the most common security mistakes beginners make." },
      ],
    },

    /* G. WHAT CAN GO WRONG */
    {
      kind: "failure",
      mode: "experiment",
      title: "The secret in the frontend",
      blocks: [
        { type: "p", text: "A beginner builds a shop website. To make it quick, they put the code that talks to the database, including the database password, into the page's JavaScript. It works perfectly in testing." },
        { type: "steps", items: [
          { title: "Recognise it", text: "Open the website, then open the browser's **View page source** or developer tools. If you can find a password, an API key, or code that talks directly to a database, it is exposed to every visitor." },
          { title: "Explain it", text: "Everything in the frontend is downloaded to the visitor's device. Anyone can read it, copy the password and connect to the database themselves: to read every customer's details, or change prices to zero." },
          { title: "Fix it", text: "Move that code to the backend. The frontend only sends a request such as `GET /products`; the backend, on the server, holds the password, checks the request and talks to the database. Then **change the password**, because the old one must be treated as stolen." },
        ] },
        { type: "callout", tone: "warn", title: "This is exactly how AI API keys leak", text: "In Module 5 you will use an API key to call AI models. A key placed in frontend code can be found and used by strangers, and you pay for every request they make. The rule is the same: keys live in the backend, never in the browser." },
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
            prompt: "What makes a program a **server**?",
            options: [
              { text: "It runs on a very large, expensive computer.", why: "Any computer can run a server program, even a laptop or a Raspberry Pi." },
              { text: "It waits for requests over a network and sends back responses.", why: "Correct. “Server” describes the job, not the size of the machine." },
              { text: "It has a screen that shows web pages.", why: "That describes a browser, which is a client." },
            ],
            answer: 1,
            hint: "Think of what the kitchen does in the restaurant.",
          },
          {
            id: "q2", type: "multi", flavour: "design",
            prompt: "You are building an online shop. Which of these must go in the **backend**? Select all that apply.",
            options: [
              { text: "The password for the database", why: "Yes. Anything in the frontend can be read by any visitor." },
              { text: "The check that a product is in stock before accepting an order", why: "Yes. Users control the frontend, so rules must be enforced on the server." },
              { text: "The colour and layout of the “Order now” button", why: "That is the frontend's job: how things look in the browser." },
              { text: "The key used to call an AI model", why: "Yes. Keys are secrets; secrets live in the backend." },
            ],
            answers: [0, 1, 3],
            hint: "Ask: would it be dangerous if a visitor could read or change this?",
          },
          {
            id: "q3", type: "mcq", flavour: "analogy",
            prompt: "In the restaurant analogy, what is the **frontend**?",
            options: [
              { text: "The kitchen", why: "The kitchen is where the work happens out of sight: the backend." },
              { text: "The menu and dining room", why: "Correct. It is what the customer sees and uses to make requests." },
              { text: "The stockroom", why: "The stockroom keeps the ingredients: it is like the database." },
            ],
            answer: 1,
            hint: "Which part of the restaurant does the customer see?",
          },
          {
            id: "q4", type: "mcq", flavour: "predict",
            prompt: "A customer changes the price on Mama Achen's order page from UGX 110,000 to UGX 1,000 using their browser's developer tools, then presses Order. With a well-built backend, what happens?",
            options: [
              { text: "The order goes through at UGX 1,000.", why: "Only if the backend trusts the price sent by the client, which it never should." },
              { text: "The backend uses its own price from the database, so the total is UGX 110,000 (or it rejects the request).", why: "Correct. The backend never trusts the client for prices, stock or permissions." },
              { text: "The browser refuses to let anyone change the page.", why: "The user fully controls their own browser and can change anything in it." },
            ],
            answer: 1,
            hint: "Who controls the frontend? Who controls the backend?",
          },
          {
            id: "q5", type: "order",
            prompt: "Put these steps in order for loading Mama Achen's price list in the example server.",
            items: [
              "The browser requests the page at /",
              "The backend sends back the HTML page (the frontend)",
              "The customer clicks “Show prices”",
              "The frontend's JavaScript requests /products",
              "The backend sends back the products as JSON",
              "The frontend shows the prices on the page",
            ],
            hint: "The browser has to get the frontend before the frontend can ask for anything.",
            explanation: "There are two requests: first for the frontend (the page), then, from that page, for the data. This pattern of “load the page, then fetch data” is how most modern websites work.",
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
          prompt: "A friend is starting an online shop and says: “I'll put everything, including the database password, in the web page. It's simpler.” Explain clients, servers, frontends and backends to them, and why that plan is dangerous.",
          rubric: [
            { concept: "Client asks, server answers", keywords: ["client", "request", "browser", "asks"], hint: "Who sends requests, and who answers them?" },
            { concept: "Frontend runs in the browser, backend on the server", keywords: ["frontend", "front end", "backend", "back end", "server"], hint: "Where does each half run?" },
            { concept: "Anyone can read the frontend", keywords: ["anyone", "can see", "can read", "view source", "visible", "download"], hint: "What can a visitor see?" },
            { concept: "Secrets and rules belong in the backend", keywords: ["password", "secret", "key", "rules", "check", "never trust"], hint: "Where must the password go, and why?" },
          ],
          exemplar: "Your customer's browser is the client: it sends requests. Your server answers them. The web page, with its buttons and JavaScript, is the frontend. It gets downloaded and runs on every visitor's phone, so anyone can open it and read it, including any password inside. The backend is code that stays on your server where visitors can't see it. It should hold the database password, talk to the database, and check every order itself, because people can change anything in their own browser. So: page in the frontend, password and rules in the backend.",
        },
      ],
    },

    /* J. RECAP */
    {
      kind: "recap",
      mode: "understand",
      blocks: [
        { type: "recap",
          summary: "A **client** sends requests; a **server** waits for them and responds. A **browser** is a general-purpose client. Websites have a **frontend** (pages and code that run in the browser, readable by anyone) and a **backend** (code on the server that applies rules, talks to the database and keeps secrets). Never trust the client: the backend must check everything.",
          canNow: [
            "Identify the client and the server in everyday apps.",
            "Explain what belongs in the frontend and what belongs in the backend.",
            "Explain why passwords and API keys must never be in frontend code.",
            "Read a simple architecture: browser, frontend, backend, database.",
          ],
          next: "Next: how does the request actually find the server? You will follow it across the internet, through DNS, IP addresses and the HTTP protocol.",
        },
      ],
    },
  ],
};

/* ---------------------------------------------------------------------- */
/*  Lesson 3: The internet, IP, DNS and HTTP                               */
/* ---------------------------------------------------------------------- */

const l3: Lesson = {
  id: "m1-l3",
  moduleId: "m1",
  title: "How a request crosses the internet",
  subtitle: "IP addresses, domain names and DNS, packets and routers, and the HTTP requests and responses that carry almost everything.",
  minutes: 35,
  prerequisites: ["m1-l2"],
  objectives: [
    "Explain what the **internet** is and how **packets** and **routers** move data.",
    "Explain **IP addresses**, **domain names** and what **DNS** does.",
    "Read a raw **HTTP request**: method, path, headers and body.",
    "Read a raw **HTTP response** and interpret its **status code**.",
    "Locate where a failure happened from what the client sees.",
  ],
  glossary: ["internet", "protocol", "packet", "router", "ip-address", "domain-name", "dns", "url", "http", "https", "http-request", "http-response", "http-method", "status-code", "http-header"],
  completion: [
    "In the trace lab, run a full trip and break DNS, the server and the database.",
    "In the HTTP lab, produce 200, 404, 405 and 500 responses.",
    "Pass the knowledge check (you can retry).",
    "Explain what happens when you type a web address, in your own words.",
  ],
  tutor: {
    simpler:
      "Every computer on the internet has a number, its IP address. People prefer names, so DNS looks up the number for a name. Then your browser sends an HTTP request (“GET me /products”) to that number. It travels in small packets, passed along by routers. The server sends back an HTTP response that starts with a status code: 200 means OK, 404 means not found, 500 means the server broke.",
    altAnalogy:
      "A boda-boda delivery service. You know the shop's name but not its location, so you ask the stage chairman (DNS), who gives you the plot number (IP address). You write a clear order slip in the format the shop expects (an HTTP request). Riders pass it along the roads, maybe changing hands at stages (routers). The shop sends back a slip that begins with a code: “OK”, “we don't sell that”, or “our kitchen is broken”.",
    misconceptions: [
      "“The internet and the web are the same thing.” The internet is the network that connects computers. The web (websites, HTTP) is one of many things that use it, alongside email, WhatsApp calls and online games.",
      "“A domain name is the website's address.” The real address is the IP number. The domain name is a human-friendly label that DNS translates.",
      "“A 404 means the website is down.” A 404 is an answer from a working server, saying: nothing exists at this path. A down server sends no answer at all.",
      "“HTTPS means the website is trustworthy.” HTTPS means the connection is encrypted and you are really talking to that domain. A scam site can have HTTPS too.",
    ],
    probingQuestions: [
      "If DNS stopped working but every server was fine, could you still visit websites? What would you need to know?",
      "You get a 500 from a website. Is the problem in your request or on the server? What about a 404?",
      "Why does a request need a Host header if it already went to the right IP address?",
    ],
    revisit: ["m1-l2"],
  },
  sections: [
    /* A. THE PROBLEM */
    {
      kind: "problem",
      mode: "understand",
      title: "From a name to a page, in under a second",
      blocks: [
        { type: "p", text: "Ritah types `shop.mamaachen.example` into her phone's browser in Ntinda. Less than a second later, Mama Achen's price list appears. The server could be in Kampala, in Johannesburg or in Ireland." },
        { type: "p", text: "How did the phone know which computer, out of billions, to talk to? How did the request get there? And how does the server's answer say “here you go” or “something went wrong”?" },
        { type: "p", text: "When something breaks, and things do break, knowing this journey is what lets you say **where** it broke. That is most of debugging." },
        { type: "callout", tone: "info", title: "The question for this lesson", text: "What exactly happens between typing a web address and seeing the page, and what does each message look like?" },
      ],
    },

    /* B. THE ANALOGY */
    {
      kind: "analogy",
      mode: "understand",
      title: "A boda-boda delivery service",
      blocks: [
        { type: "p", text: "Imagine ordering from a shop you have never visited, using a boda-boda delivery service." },
        { type: "steps", items: [
          { title: "You know the shop's name, but not where it is.", text: "So you ask someone who knows: the stage chairman. He gives you the exact location: “Plot 10, Ntinda Road.”" },
          { title: "You write an order slip in the shop's standard format.", text: "“GET: price list. For: Mama Achen's shop. From: Ritah.” Any shop on the service can read this format." },
          { title: "Riders carry it along the roads.", text: "It may change hands at several stages. No rider knows the whole route; each one just sends it a step closer." },
          { title: "The shop sends back a reply slip that starts with a code.", text: "“OK, here is the list.” Or “No such item.” Or “Sorry, our kitchen is broken.” Then the riders carry it back." },
        ] },
        { type: "analogyMap", title: "From delivery service to the internet", pairs: [
          { everyday: "The shop's name", technical: "A [[domain-name|domain name]], like `shop.mamaachen.example`" },
          { everyday: "Plot number and street", technical: "An [[ip-address|IP address]], like `203.0.113.10`" },
          { everyday: "Asking the stage chairman", technical: "A [[dns|DNS]] lookup" },
          { everyday: "The order slip in a standard format", technical: "An [[http-request|HTTP request]]" },
          { everyday: "Riders and stages along the roads", technical: "[[packet|Packets]] passed between [[router|routers]] across the [[internet|internet]]" },
          { everyday: "The reply slip and its code", technical: "An [[http-response|HTTP response]] and its [[status-code|status code]]" },
        ] },
        { type: "callout", tone: "warn", title: "Where the analogy breaks", text: "A long order would be one slip. On the internet, a big message is cut into many small **packets**, which may even take different routes and arrive out of order; the receiving computer puts them back together. Also, internet “riders” travel at close to the speed of light, so a trip to Europe and back takes a fraction of a second." },
      ],
    },

    /* C. THE VISUALISATION */
    {
      kind: "visual",
      mode: "experiment",
      title: "Trace the trip, then break it",
      blocks: [
        { type: "p", text: "Run a full trip first with **Everything works**, reading the inspector at each step: the DNS question and answer, the HTTP request, the database query and the HTTP response. Then use **Break something** to cause each failure and see exactly where the trip stops." },
        { type: "lab", lab: "internet-trace", props: { scenario: "web", challenge: "full" }, required: true, caption: "Complete when you have run one successful trip and broken DNS, the server and the database, each to the last step." },
        { type: "callout", tone: "sim", text: "A teaching simulation. The domain uses the reserved `.example` ending, and the IP addresses come from ranges reserved for documentation (`203.0.113.x`, `198.51.100.x`), so none point at a real machine. The message formats (DNS records, HTTP text, SQL) are real; real requests carry more headers. The error pages are approximations of what Chrome shows." },
      ],
    },

    /* D. THE TECHNICAL EXPLANATION */
    {
      kind: "technical",
      mode: "understand",
      title: "IP, DNS and HTTP, precisely",
      blocks: [
        { type: "p", text: "The [[internet|internet]] is a network of networks: your mobile operator's network, university networks, data-centre networks and thousands more, all connected and all following shared rules called [[protocol|protocols]]." },
        { type: "p", text: "**IP addresses and packets.** Every device on the internet is reached through an [[ip-address|IP address]]. The common kind, IPv4, is four numbers from 0 to 255, like `203.0.113.10`; the newer IPv6 is longer, like `2001:db8::10`. Data is sent in [[packet|packets]]: small chunks, each labelled with a source and a destination address. [[router|Routers]] read the destination and pass each packet one hop closer. Software on both ends (a protocol called TCP) numbers the packets, re-sends lost ones and puts them back in order." },
        { type: "p", text: "**DNS.** People remember names; packets need numbers. The [[dns|Domain Name System]] connects them. Your device asks a **DNS resolver** (usually run by your mobile network or internet provider), “What is the IP address of `shop.mamaachen.example`?” The resolver finds the answer by asking the servers responsible for that name, then replies. Answers come with a **TTL** (time to live): how many seconds the answer may be remembered, so the lookup isn't repeated for every page." },
        { type: "table", caption: "The parts of a URL", head: ["Part", "Example", "Meaning"], rows: [
          ["Scheme", "`https://`", "Which protocol to use. `https` = HTTP over an encrypted connection"],
          ["Domain name", "`shop.mamaachen.example`", "Which server. DNS turns it into an IP address"],
          ["Path", "`/products`", "Which thing on that server"],
          ["Query", "`?search=rice`", "Extra details for the server"],
        ] },
        { type: "p", text: "**HTTP.** Once the phone has the IP address, it connects to the server and sends an [[http-request|HTTP request]]. [[http|HTTP]] requests and responses are plain, structured text:" },
        { type: "code", lang: "http", caption: "An HTTP request", code: `GET /products?search=rice HTTP/1.1
Host: shop.mamaachen.example
Accept: text/html`, notes: [
          { line: 1, text: "The **request line**: a [[http-method|method]] (`GET`, meaning “give me”), a path, and the protocol version." },
          { line: 2, text: "[[http-header|Headers]]: `Name: value` lines. `Host` says which website you want, because one server (one IP address) can host many websites." },
          { line: 3, text: "`Accept` says what kinds of content the client can handle. A blank line ends the headers; a body may follow." },
        ] },
        { type: "code", lang: "http", caption: "An HTTP response (body shortened)", code: `HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Content-Length: 268

<!doctype html>
<h1>Search results: rice</h1> ...`, notes: [
          { line: 1, text: "The **status line**: the protocol version, a [[status-code|status code]] (200) and a short reason (OK)." },
          { line: 2, text: "`Content-Type` says what the body is: here, an HTML page." },
          { line: 3, text: "`Content-Length` says how many bytes the body has, so the client knows when it has received all of it." },
          { line: 5, text: "After a blank line comes the **body**: the page or data itself." },
        ] },
        { type: "table", caption: "The methods and status codes you will see most", head: ["", "Meaning"], rows: [
          ["`GET`", "Read something. Should never change data"],
          ["`POST`", "Send something new, such as an order or a form"],
          ["`PUT` / `DELETE`", "Replace / remove something"],
          ["**2xx** (200 OK, 201 Created)", "Success"],
          ["**3xx** (301, 302)", "Redirect: look somewhere else"],
          ["**4xx** (400, 401, 404, 405)", "The **request** was wrong: bad data, not allowed, nothing at this path, wrong method"],
          ["**5xx** (500, 503)", "The **server** failed while handling a request that may have been fine"],
        ] },
        { type: "callout", tone: "tip", title: "HTTPS", text: "With [[https|HTTPS]], the HTTP text is sent inside an encrypted connection (TLS). Routers and anyone on the same Wi-Fi can see which IP address you are talking to, but not the request or response. The browser also checks a certificate proving the server really owns that domain name. HTTPS proves **who** you are talking to, not that they are honest." },
        { type: "callout", tone: "misconception", text: "“404 means the site is down.” No. A 404 is a reply from a **working** server: “I have nothing at that path.” A server that is down sends nothing at all, and the browser eventually reports a timeout or “connection refused”." },
      ],
    },

    /* E. THE WORKING EXAMPLE */
    {
      kind: "example",
      mode: "build",
      title: "Look up a name and talk HTTP yourself",
      blocks: [
        { type: "p", text: "Two real tools let you see these steps on any computer. `nslookup` asks DNS for a name's address (built into Windows and macOS; on Linux it may need the `dnsutils` or `bind-utils` package). `curl` sends an HTTP request and prints the response (built into Windows 10 and 11, macOS and most Linux systems; in Windows PowerShell type `curl.exe`, because plain `curl` there means a different command)." },
        { type: "code", lang: "bash", code: `nslookup wikipedia.org
curl -i http://localhost:3000/products`, notes: [
          { line: 1, text: "Ask DNS for the IP addresses of `wikipedia.org`. You will see the resolver that answered and one or more addresses. Which addresses you get depends on where you are." },
          { line: 2, text: "Send `GET /products` to the server from Lesson 2 (running on your own computer) and print the response, including headers (`-i`)." },
        ] },
        { type: "p", text: "Here is the real response we got from the Lesson 2 server with that `curl` command:" },
        { type: "code", lang: "http", caption: "Real output (the Date will differ)", code: `HTTP/1.1 200 OK
Content-Type: application/json
Date: Wed, 04 Nov 2026 15:32:23 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

[{"name":"Rice (25 kg bag)","priceUGX":110000},{"name":"Sugar (1 kg)","priceUGX":5500}]`, notes: [
          { line: 1, text: "Status 200: success. This came from `res.writeHead(200, …)` in the server code." },
          { line: 2, text: "The `Content-Type` header the server code set." },
          { line: 3, text: "Node adds the `Date` header automatically." },
          { line: 4, text: "`keep-alive`: the connection can be reused for the next request, which saves time." },
          { line: 6, text: "Instead of `Content-Length`, Node sent the body in chunks. Both are valid ways to say where the body ends." },
          { line: 8, text: "The body: the product data as JSON." },
        ] },
        { type: "p", text: "And this is how the frontend in Lesson 2 made the same request in JavaScript, using the browser's built-in `fetch` function. You will write code like this in Module 2:" },
        { type: "code", lang: "js", code: `const response = await fetch("/products");
console.log(response.status);                      // 200
console.log(response.headers.get("content-type")); // "application/json"
const items = await response.json();`, notes: [
          { line: 1, text: "`fetch` builds and sends the HTTP request. The browser does the DNS lookup and connection for you." },
          { line: 2, text: "The status code from the response's first line." },
          { line: 4, text: "Read the body and turn the JSON text into data the code can use." },
        ] },
      ],
    },

    /* F. THE INTERACTIVE CHALLENGE */
    {
      kind: "challenge",
      mode: "experiment",
      title: "Be the browser",
      blocks: [
        { type: "p", text: "Now you write the requests. Send them to the mock shop server and read the raw text that goes each way. Your mission: get the server to answer with each of the four status codes **200, 404, 405 and 500**. For each one, read the explanation and the headers." },
        { type: "lab", lab: "http-request", required: true, caption: "Complete when you have collected a 200, a 404, a 405 and a 500 response." },
        { type: "callout", tone: "sim", text: "The server here is a small simulation running in your browser; no request leaves your device. Its responses follow real HTTP/1.1 rules, for example a 405 always includes an `Allow` header listing the methods that are allowed." },
        { type: "callout", tone: "tip", text: "Extra: try `POST /orders` with the example body, then break the JSON (delete a quote mark) and send it again. Which status code do you get, and whose fault does it say the problem is?" },
      ],
    },

    /* G. WHAT CAN GO WRONG */
    {
      kind: "failure",
      mode: "experiment",
      title: "Where did it break?",
      blocks: [
        { type: "p", text: "From the outside, every failure looks like “the website doesn't work”. An engineer asks: how far did the request get? The client's error tells you." },
        { type: "table", caption: "Reading failures from the client's side", head: ["What you see", "How far it got", "Likely cause", "Who can fix it"], rows: [
          ["“No internet” (ERR_INTERNET_DISCONNECTED)", "Never left the phone", "No Wi-Fi or data, airplane mode, no bundle", "You"],
          ["“Site can't be reached”, DNS_PROBE_FINISHED_NXDOMAIN", "DNS said the name doesn't exist", "A typo, or the domain expired or was never set up", "You (typo) or the site owner"],
          ["Long wait, then ERR_CONNECTION_TIMED_OUT or REFUSED", "Reached the address; nothing answered", "Server switched off or crashed", "The site owner"],
          ["**404** Not Found", "Reached a working server", "Wrong path, or the item was removed", "You (fix the path) or the site owner"],
          ["**500** / **503**", "Reached a working server, which then failed", "A bug in the backend, or the database is down", "The site owner"],
        ] },
        { type: "callout", tone: "warn", title: "Why this matters for agents", text: "Your agents will call AI models and tools over HTTP all the time. When a call fails, the first question is always the same: is it my request (4xx: fix the request and do not simply retry), or their server (5xx or timeout: wait and maybe retry)? Module 5 builds this into real code." },
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
            prompt: "What does **DNS** do?",
            options: [
              { text: "Encrypts your messages so nobody can read them", why: "That is TLS, the S in HTTPS." },
              { text: "Turns a domain name into the IP address of the server", why: "Correct. It is the internet's lookup system for names." },
              { text: "Stores the website's pages", why: "Pages come from the website's server, not from DNS." },
              { text: "Carries packets between routers", why: "Routers and IP do that. DNS only answers “which address?”." },
            ],
            answer: 1,
            hint: "Think of the stage chairman in the boda-boda story.",
          },
          {
            id: "q2", type: "order",
            prompt: "Put the steps in order for loading the shop's `/products` page in a browser.",
            items: [
              "The browser asks a DNS resolver for the domain's IP address",
              "The resolver answers with the IP address",
              "The browser sends GET /products to that IP address",
              "The server's backend queries the database",
              "The server sends back an HTTP response with status 200",
              "The browser draws the page",
            ],
            hint: "You cannot send anything to a server before you know its address.",
            explanation: "Name → address (DNS), then request → server → database → response → display. The trace lab follows exactly this order.",
          },
          {
            id: "q3", type: "mcq", flavour: "debug",
            prompt: "You request `GET /products/mango` and receive `HTTP/1.1 404 Not Found`. What does this tell you?",
            options: [
              { text: "The shop's server is switched off.", why: "A switched-off server cannot send any response, not even a 404." },
              { text: "DNS could not find the shop.", why: "Then you would never have reached the server at all." },
              { text: "The server is working, but has nothing at that path.", why: "Correct. 4xx means the request asked for something wrong; here, a product that doesn't exist." },
              { text: "The server's code crashed.", why: "A crash would give a 5xx code, such as 500." },
            ],
            answer: 2,
            hint: "Who sent the 404? What does that prove about the server?",
          },
          {
            id: "q4", type: "mcq", flavour: "predict",
            prompt: "You send `DELETE /products` to a shop that only lets customers read its product list. Which response do you expect?",
            options: [
              { text: "200 OK, and all products are deleted", why: "A well-built server will not let customers delete its products." },
              { text: "405 Method Not Allowed, with an Allow: GET header", why: "Correct. The path exists, but this method is not accepted on it, and Allow lists the methods that are." },
              { text: "404 Not Found", why: "The path exists (GET works), so 404 would be misleading. 405 is the precise answer." },
            ],
            answer: 1,
            hint: "The path is fine. The method is the problem.",
          },
          {
            id: "q5", type: "multi", flavour: "recall",
            prompt: "Which of these are part of an HTTP **request**? Select all that apply.",
            options: [
              { text: "A method, such as GET or POST", why: "Yes, in the first line." },
              { text: "A path, such as /products", why: "Yes, in the first line, after the method." },
              { text: "A status code, such as 200", why: "No. Status codes are in responses: the server's verdict." },
              { text: "Headers, such as Host", why: "Yes. Requests and responses both have headers." },
            ],
            answers: [0, 1, 3],
            hint: "The client asks; the server gives the verdict.",
          },
          {
            id: "q6", type: "mcq", flavour: "design",
            prompt: "An AI service replies to your agent's request with a **503 Service Unavailable**. What is the sensible reaction?",
            options: [
              { text: "Change the request: it must be wrong.", why: "5xx codes mean the server failed. The request may be perfectly fine." },
              { text: "Wait a little and try again, a limited number of times.", why: "Correct. 503 means “temporarily unavailable”. A short wait and a limited retry is the standard response." },
              { text: "Give up forever: the service is gone.", why: "503 says temporarily. Giving up at once is too drastic." },
            ],
            answer: 1,
            hint: "Whose side is a 5xx error on? Is it permanent?",
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
          prompt: "Explain to a classmate what happens, step by step, between typing `shop.mamaachen.example` into a browser and seeing the page. Include what DNS does, what the request and response contain, and how you could tell a DNS problem from a server problem.",
          rubric: [
            { concept: "DNS turns the name into an IP address", keywords: ["dns", "ip address", "ip", "lookup", "look up"], hint: "How does the phone find out which computer to contact?" },
            { concept: "The browser sends an HTTP request with a method and path", keywords: ["request", "get", "http", "path", "method"], hint: "What exactly does the browser send?" },
            { concept: "The server answers with a response and status code", keywords: ["response", "status", "200", "404", "500", "code"], hint: "What comes back, and how does it say whether it worked?" },
            { concept: "Telling failures apart", keywords: ["typo", "not found", "can't be reached", "cannot be reached", "timeout", "timed out", "5xx", "500", "nxdomain", "server error"], hint: "What would you see for each kind of failure?" },
          ],
          exemplar: "First the phone asks a DNS resolver: what is the IP address of shop.mamaachen.example? DNS answers with a number like 203.0.113.10. Then the browser sends an HTTP request to that address, split into packets that routers pass along. The request says GET /products, plus headers like Host. The server's backend handles it, maybe asks the database, and sends back a response that starts with a status code: 200 means OK and the body has the page. If DNS fails, for example because of a typo, the browser says the site can't be reached and the server is never contacted. If the server is reached but its code breaks, you get a 500. If the server is off, you wait and get a timeout.",
        },
      ],
    },

    /* J. RECAP */
    {
      kind: "recap",
      mode: "understand",
      blocks: [
        { type: "recap",
          summary: "The **internet** carries data in **packets** between **IP addresses**, passed along by **routers**. **DNS** turns a **domain name** into an IP address. Then the client sends an **HTTP request** (method, path, headers, optional body), and the server returns an **HTTP response** (status code, headers, body). 2xx means success, 4xx means the request was wrong, and 5xx means the server failed. **HTTPS** encrypts the conversation.",
          canNow: [
            "Explain what happens when you type a web address.",
            "Read raw HTTP requests and responses.",
            "Interpret common status codes: 200, 201, 400, 404, 405, 500, 503.",
            "Tell from the client's error roughly where a request failed.",
          ],
          next: "Next: where do servers actually live, and where is the data kept? Cloud computing, databases, and choosing between local and remote execution.",
        },
      ],
    },
  ],
};

/* ---------------------------------------------------------------------- */
/*  Lesson 4: Cloud computing, databases, local vs remote                  */
/* ---------------------------------------------------------------------- */

const l4: Lesson = {
  id: "m1-l4",
  moduleId: "m1",
  title: "The cloud, databases, and where code runs",
  subtitle: "Where servers live, how a database keeps a shop's records, and how to decide what runs locally and what runs remotely.",
  minutes: 35,
  prerequisites: ["m1-l3"],
  objectives: [
    "Explain what **cloud computing** is, and what renting a server gives you.",
    "Explain what a **database** is, and why a backend uses one instead of files on a laptop.",
    "Read a simple database **table** with a **primary key** and **foreign keys**.",
    "Read basic **SQL**: SELECT with WHERE and ORDER BY, INSERT, and a JOIN.",
    "Decide whether a task should run **locally** or **remotely**, and explain the trade-offs.",
  ],
  glossary: ["cloud-computing", "data-centre", "hosting", "database", "table", "sql", "primary-key", "foreign-key", "local-execution", "remote-execution", "latency", "server", "backend"],
  completion: [
    "In the database explorer: run a filter or sort, look up an order, add a row, and reload the page to see it survive.",
    "Pass the knowledge check (you can retry).",
    "Explain, in your own words, why a shop's data belongs in a database on a server.",
  ],
  tutor: {
    simpler:
      "A website's server has to be on all the time, so most people rent one from a cloud company instead of keeping a computer running at home. The server keeps its data in a database: tables with rows and columns, like a careful stock book. Your page asks the backend, the backend asks the database with SQL, and the data stays in the database even when you close the page. Some work runs on your own device (local); some runs on servers (remote).",
    altAnalogy:
      "Renting a stall in a big, guarded market instead of building your own shop: the market provides the roof, power, security and customers' access; you bring your goods and your way of working. You pay rent for what you use, and can rent a bigger stall when business grows.",
    misconceptions: [
      "“The cloud is somewhere in the sky.” The cloud is ordinary computers in large buildings called data centres, owned by companies that rent them out.",
      "“The page holds the data.” A web page only displays a copy it fetched. The real data lives in the database on the server; that's why it is still there when you reload.",
      "“A spreadsheet is a database.” A spreadsheet file is fine for one person. A database is a program designed for many simultaneous users, with rules that keep the data consistent.",
      "“Remote is always better.” Remote needs a connection, adds delay and may cost money per use. For private or offline tasks, local can be the better choice.",
    ],
    probingQuestions: [
      "Why would Mama Achen rent a server instead of running the website from her laptop at the stall?",
      "An order row stores `customer_id: 3`, not the customer's name. Why is that useful?",
      "Your agent needs to call an AI model. Is that local or remote execution? What does it need in order to work?",
    ],
    revisit: ["m1-l2", "m1-l3"],
  },
  sections: [
    /* A. THE PROBLEM */
    {
      kind: "problem",
      mode: "understand",
      title: "The laptop under the counter",
      blocks: [
        { type: "p", text: "Mama Achen's nephew, Daniel, builds her shop website and runs it on his laptop, which sits under the counter at the stall. The prices are in a spreadsheet on the same laptop. For a week it is wonderful." },
        { type: "p", text: "Then the problems start. Every evening Daniel takes the laptop home, and the website disappears. During a power cut, it disappears. One afternoon two customers order the last bag of rice at the same moment, and both are told “confirmed”. And when the laptop's screen cracks, everyone asks: are all our records gone?" },
        { type: "p", text: "Daniel has built a working client and server. What he is missing is a **place** for the server to live, and a proper **home for the data**." },
        { type: "callout", tone: "info", title: "The question for this lesson", text: "Where should servers and data live, and how do you decide what runs on the user's device and what runs on a server?" },
      ],
    },

    /* B. THE ANALOGY */
    {
      kind: "analogy",
      mode: "understand",
      title: "From a laptop under the counter to a stall in a guarded market",
      blocks: [
        { type: "p", text: "Compare two ways of running Mama Achen's stock." },
        { type: "compare",
          left: { title: "The exercise book under the counter", items: [
            "Only works when she is at the stall",
            "Lost if it gets wet or stolen",
            "Two helpers writing at once make a mess",
            "Free, and completely private",
          ] },
          right: { title: "A clerk in a stockroom at a big, guarded market", items: [
            "Open all day and night, with backup power and guards",
            "The clerk keeps the stock book carefully and makes copies",
            "Handles one update at a time, so the count stays right",
            "Costs rent, and she must trust the market",
          ] },
        },
        { type: "analogyMap", title: "From the market to the cloud", pairs: [
          { everyday: "A big, guarded market that rents out stalls", technical: "A cloud provider's [[data-centre|data centre]]" },
          { everyday: "Renting a stall and paying monthly", technical: "[[cloud-computing|Cloud computing]]: renting servers and paying for what you use" },
          { everyday: "Running the stall from the rented space", technical: "[[hosting|Hosting]] your backend on a cloud server" },
          { everyday: "The stockroom clerk and the stock book", technical: "A [[database|database]]: one careful keeper of the records" },
          { everyday: "A ruled page with one line per sack", technical: "A database [[table|table]]: one row per product" },
          { everyday: "Asking the clerk, in a fixed way, “all rice, cheapest first”", technical: "A [[sql|SQL]] query" },
          { everyday: "Doing a sum on your own calculator vs. phoning the stockroom", technical: "[[local-execution|Local]] vs. [[remote-execution|remote]] execution" },
        ] },
        { type: "callout", tone: "warn", title: "Where the analogy breaks", text: "A market stall takes weeks to set up. A cloud server can be rented in minutes, made bigger in seconds and switched off just as fast, and many are billed by the hour or second. Also, a stockroom clerk can't answer 1,000 questions per second; a well-run database can." },
      ],
    },

    /* C. THE VISUALISATION */
    {
      kind: "visual",
      mode: "experiment",
      title: "Explore a real-shaped shop database",
      blocks: [
        { type: "p", text: "Here are Mama Achen's three tables: **products**, **customers** and **orders**. Filter and sort them, look up an order, add a row, then press **Reload the page** and see what survives. Every action shows the SQL a backend would send." },
        { type: "lab", lab: "database-explorer", required: true, caption: "Complete all four tasks in the checklist, including reloading the page after you add a row." },
        { type: "callout", tone: "sim", text: "The “database” here is a simulation that lives in your browser's memory, standing in for a database server. **Reload the page** simulates a page reload while the database keeps running. A real browser refresh (F5) resets this simulation, because here everything is in your browser; a real database runs on a server and stores its data on disk. The SQL shown is real and runs in SQLite; names, dates and prices are illustrative." },
      ],
    },

    /* D. THE TECHNICAL EXPLANATION */
    {
      kind: "technical",
      mode: "understand",
      title: "Cloud, databases, and where code runs",
      blocks: [
        { type: "p", text: "**Cloud computing.** A server must be always on, always connected and protected. Running that yourself means buying machines, backup power, cooling and a fast connection. [[cloud-computing|Cloud computing]] means renting those from companies that run huge [[data-centre|data centres]], such as Amazon Web Services, Google Cloud and Microsoft Azure, and smaller hosting companies. You pay for what you use, and can grow or shrink in minutes. Putting your backend on such a server is called [[hosting|hosting]]." },
        { type: "list", items: [
          "**What you rent:** virtual servers (a share of a big machine that behaves like your own computer), managed databases, file storage, and ready-made services, including AI models.",
          "**Where it is:** in specific regions. Data centres close to your users mean less [[latency|latency]] (delay). The large providers have data centres in South Africa, Europe and elsewhere; check each provider's current list of regions.",
          "**What it costs:** anything from free tiers for small projects to large monthly bills. Prices change often, so always check the provider's current pricing page.",
        ] },
        { type: "p", text: "**Databases.** A [[database|database]] is a program whose job is to store data permanently and let other programs read and change it, quickly and safely, even when many requests arrive at once. The most common kind, a **relational database** (PostgreSQL, MySQL, SQLite), stores data in [[table|tables]]:" },
        { type: "list", items: [
          "Each **row** is one thing (one product, one customer, one order); each **column** is one fact about it (name, price).",
          "A [[primary-key|primary key]], usually `id`, is unique for each row.",
          "A [[foreign-key|foreign key]] stores another table's id to link rows. An order stores `customer_id: 3` rather than copying the customer's name, so if the customer changes their name, it only changes in one place.",
          "You talk to it in [[sql|SQL]]: `SELECT` reads, `INSERT` adds, `UPDATE` changes, `DELETE` removes. A `JOIN` combines rows from tables using those ids.",
        ] },
        { type: "callout", tone: "info", title: "Why not a spreadsheet on a laptop?", text: "A database handles many users at once without corrupting the data (two customers buying the last bag of rice: only one succeeds). It checks rules (an order must point at a real customer). It can be backed up and copied while running. And it sits next to the server, always on. A spreadsheet is a file built for one person at a time." },
        { type: "p", text: "**Local or remote?** Every piece of software runs somewhere. The choice is a trade-off:" },
        { type: "table", caption: "Choosing where code runs", head: ["", "Local (on the user's device)", "Remote (on a server)"], rows: [
          ["Works offline", "Yes", "No: needs a connection"],
          ["Speed", "No network delay, but limited by the device", "Network delay, but servers can be very powerful"],
          ["Shared data", "Each device has its own copy", "One true copy everyone sees"],
          ["Secrets and rules", "Cannot be kept safe: the user controls the device", "Safe: users cannot see the code"],
          ["Cost", "Paid for once, with the device", "Ongoing: hosting, and sometimes per request"],
          ["Examples", "Calculator, camera, offline maps", "Mobile money transfers, bank balances, ChatGPT"],
        ] },
        { type: "callout", tone: "tip", title: "Agents run in both places", text: "When your agent calls a large AI model through an API, that is remote execution: your code sends an HTTP request to the provider's servers and waits for the response. The agent's own loop and tools usually run on **your** server, which is remote to the user but local to your code. Some small models can run locally on a laptop, trading quality for privacy and offline use. You will make these choices yourself in later modules." },
      ],
    },

    /* E. THE WORKING EXAMPLE */
    {
      kind: "example",
      mode: "build",
      title: "Real SQL for the shop",
      blocks: [
        { type: "p", text: "This SQL creates a products table, adds three products, asks a question and records a sale. It is standard SQL and runs as-is in SQLite, a small free database. We ran it with the SQLite built into Node.js 22." },
        { type: "code", lang: "text", caption: "shop.sql", code: `CREATE TABLE products (
  id        INTEGER PRIMARY KEY,
  name      TEXT NOT NULL,
  price_ugx INTEGER NOT NULL,
  stock     INTEGER NOT NULL
);

INSERT INTO products (name, price_ugx, stock) VALUES ('Rice', 110000, 14);
INSERT INTO products (name, price_ugx, stock) VALUES ('Sugar', 5500, 60);
INSERT INTO products (name, price_ugx, stock) VALUES ('Cooking oil', 8500, 0);

SELECT name, price_ugx FROM products WHERE stock > 0 ORDER BY price_ugx;

UPDATE products SET stock = stock - 2 WHERE name = 'Rice';`, notes: [
          { line: 1, text: "Create a table called `products` with four columns." },
          { line: 2, text: "`id` is the primary key. SQLite fills it in automatically (1, 2, 3…) when you don't give one." },
          { line: 3, text: "`NOT NULL` is a rule: every product must have a name. The database refuses rows that break its rules." },
          { line: 4, text: "Prices are whole numbers of shillings, so `INTEGER` is the right type." },
          { line: 8, text: "Add a row. Text goes in single quotes; numbers don't." },
          { line: 12, text: "Ask a question: names and prices of products **in stock**, cheapest first." },
          { line: 14, text: "Record a sale of 2 bags of rice: the stock goes from 14 to 12." },
        ] },
        { type: "code", lang: "text", caption: "Result of the SELECT (real output, formatted as a table)", code: `name  | price_ugx
------+----------
Sugar |      5500
Rice  |    110000` },
        { type: "p", text: "Cooking oil is missing because its stock is 0. In a real shop, the backend from Lesson 2 would send this exact SQL to the database whenever a customer opens the price list, and turn the result into a page or JSON." },
        { type: "callout", tone: "warn", title: "Never build SQL by gluing in user text", text: "If a backend pastes whatever a customer typed straight into an SQL string, a crafted input can change the query itself. This attack is called **SQL injection**. Real backends pass user input separately from the SQL text (“parameters”). You will see how when you write backends later in the course." },
      ],
    },

    /* F. THE INTERACTIVE CHALLENGE */
    {
      kind: "challenge",
      mode: "experiment",
      title: "Investigate the shop's records",
      blocks: [
        { type: "p", text: "Use the database explorer above to answer these questions. For each one, look at the SQL it shows." },
        { type: "list", ordered: true, items: [
          "Which products cost more than UGX 20,000? (Filter `price_ugx` greater than 20000.)",
          "Which product is out of stock? (Filter `stock` = 0.)",
          "Who placed order 4, and what did it cost in total? (Look up order 4.)",
          "Add yourself as a customer. Then add an order for yourself. What happens if you use a `customer_id` that doesn't exist?",
          "Press **Reload the page**. Which things disappeared, and which stayed? Why?",
        ] },
        { type: "p", text: "Then decide, for each of these, whether it should run **locally** on the user's phone or **remotely** on a server, and why: a torch app; checking a mobile money balance; a dictionary app for use in villages with poor network; an agent that answers customers using the shop's live stock." },
        { type: "callout", tone: "tip", text: "Suggested answers: torch, local (only needs the phone's hardware). Balance, remote (one true record, kept safe by the provider). Dictionary, local (must work offline; the data rarely changes). Shop agent, remote (needs live shared data, and its API keys must stay secret)." },
      ],
    },

    /* G. WHAT CAN GO WRONG */
    {
      kind: "failure",
      mode: "experiment",
      title: "Lost data, double-sold rice",
      blocks: [
        { type: "steps", items: [
          { title: "Failure 1: data kept only in the page", text: "**Recognise it:** a customer fills a long form, the network drops, they refresh, and everything is gone. Or a cart empties when they switch phones. **Explain it:** the data only lived in the page (memory on the phone) and was never saved to the database. **Fix it:** save important data to the backend's database as soon as possible; keep only temporary things in the page." },
          { title: "Failure 2: two copies of the truth", text: "**Recognise it:** stock numbers that disagree between the website and the shop's own records; two customers both told the last bag is theirs. **Explain it:** the data lives in more than one place (a spreadsheet and a website, or two laptops), and nobody controls who updates what. **Fix it:** one database is the single source of truth; every program reads and writes through it. Databases also offer **transactions**, which make “check stock, then reduce stock” happen as one indivisible step." },
          { title: "Failure 3: the database is unreachable", text: "**Recognise it:** the website shows a 500 or 503 error; the server's log says something like `ECONNREFUSED`. **Explain it:** the backend is running but cannot reach the database (it is down, or the network between them is broken). **Fix it:** restore the database, and use monitoring so the team learns of the problem before customers do. You broke the database on purpose in Lesson 3's trace lab." },
        ] },
        { type: "callout", tone: "cost", title: "Cloud bills can surprise you", text: "Cloud servers keep charging while they run, even if nobody uses them, and some services charge per request. Beginners sometimes leave test servers running for months. Set a budget alert with your provider, and switch off what you are not using. (Amounts vary by provider; check their current pricing in USD.)" },
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
            prompt: "What is **cloud computing**?",
            options: [
              { text: "Storing data in the sky using satellites", why: "Despite the name, the cloud is ordinary computers in buildings on the ground." },
              { text: "Renting servers, storage and services in someone else's data centre, paying for what you use", why: "Correct." },
              { text: "A type of database", why: "Cloud providers offer databases, but cloud computing is much broader." },
              { text: "Any program that uses the internet", why: "Many programs use the internet without being cloud services." },
            ],
            answer: 1,
            hint: "Think of renting a stall in a big market.",
          },
          {
            id: "q2", type: "mcq", flavour: "predict",
            prompt: "In the database explorer you add a new customer, then press **Reload the page**. What happens?",
            options: [
              { text: "The new customer is gone, because reloading clears everything.", why: "Reloading clears the page's own state, but the row was saved in the database." },
              { text: "The new customer is still there, because it was saved in the database, and the page fetched it again.", why: "Correct. The page shows a copy; the database keeps the real data." },
              { text: "The whole database is reset to how it started.", why: "Reloading a page does not touch the database on the server." },
            ],
            answer: 1,
            hint: "Where was the new row stored: in the page, or in the database?",
          },
          {
            id: "q3", type: "mcq", flavour: "recall",
            prompt: "An order row contains `customer_id: 3`. What is `customer_id`?",
            options: [
              { text: "A primary key of the orders table", why: "The orders table's primary key is its own `id` column." },
              { text: "A foreign key: it points at the row with id 3 in the customers table", why: "Correct. It links the order to its customer without copying the customer's details." },
              { text: "The number of customers who made this order", why: "It is an id, not a count." },
            ],
            answer: 1,
            hint: "It holds the id of a row in a different table.",
          },
          {
            id: "q4", type: "mcq", flavour: "debug",
            prompt: "Mama Achen's website shows stock of 5 bags of rice, but the shop actually has 2. The website reads from a spreadsheet that Daniel updates from the shop's exercise book every few days. What is the root cause?",
            options: [
              { text: "The website's server is too slow.", why: "Speed doesn't explain wrong numbers." },
              { text: "There are two copies of the truth, updated at different times.", why: "Correct. The fix is one database that every sale is recorded in, which the website reads directly." },
              { text: "DNS is pointing at the wrong server.", why: "Then the site wouldn't load at all, or would show a different site." },
            ],
            answer: 1,
            hint: "Where does the true stock count live? How many places is it written?",
          },
          {
            id: "q5", type: "multi", flavour: "design",
            prompt: "Which of these should run **remotely** on a server? Select all that apply.",
            options: [
              { text: "Checking whether a customer's mobile money balance covers a payment", why: "Yes. Balances must be one true record that users cannot change." },
              { text: "Making the phone's torch turn on", why: "No. That only needs the phone's own hardware." },
              { text: "The agent code that holds the AI API key and runs the shop's tools", why: "Yes. Secrets and shared data must stay on the server." },
              { text: "Showing an offline Luganda–English dictionary in a village with no network", why: "No. It must work offline, so it should run locally." },
            ],
            answers: [0, 2],
            hint: "Remote is right when you need shared data, secrets or heavy computing, and you can rely on a connection.",
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
          prompt: "Daniel asks: “The site works on my laptop. Why should Mama Achen pay for a cloud server and a database?” Explain cloud hosting, what a database does that his spreadsheet doesn't, and when running on the server (remote) is better than running on the user's phone (local).",
          rubric: [
            { concept: "A server must be always on and reachable", keywords: ["always on", "24", "power", "switched off", "takes it home", "reachable", "available"], hint: "What happens to the site when the laptop goes home?" },
            { concept: "Cloud means renting servers in a data centre", keywords: ["cloud", "rent", "data centre", "data center", "hosting", "provider"], hint: "What does Mama Achen actually pay for?" },
            { concept: "A database keeps one safe, shared copy of the data", keywords: ["database", "one copy", "single", "many users", "same time", "rules", "table", "backup"], hint: "What goes wrong when two customers buy the last bag at once?" },
            { concept: "Local vs remote trade-off", keywords: ["local", "remote", "offline", "secret", "shared", "connection"], hint: "When is each one the right choice?" },
          ],
          exemplar: "A website has to be reachable all day, but your laptop goes home at night and dies in power cuts. With cloud hosting you rent a server in a data centre that is always on, with backup power and a fast connection, and you pay for what you use. The data should go in a database next to that server, not a spreadsheet: a database keeps one true copy, lets many customers order at the same time without selling the same bag twice, checks rules and can be backed up. Things that need shared data or secrets, like stock and orders, should run remotely on the server. Things that must work offline or only need the phone, like a calculator, can run locally.",
        },
      ],
    },

    /* J. RECAP */
    {
      kind: "recap",
      mode: "understand",
      blocks: [
        { type: "recap",
          summary: "**Cloud computing** is renting servers and services in data centres instead of running your own machines. A backend keeps its data in a **database**: **tables** of rows and columns, linked by **primary** and **foreign keys**, queried with **SQL**. The page only shows a copy; the database keeps the real data. Every piece of code runs somewhere: **locally** (offline, private, but no shared truth or secrets) or **remotely** (shared data, safe secrets, but needs a connection and costs money).",
          canNow: [
            "Explain what the cloud is and why websites are hosted there.",
            "Read a database table and simple SQL queries.",
            "Explain why data belongs in a database, not in a page or a laptop spreadsheet.",
            "Decide whether a task should run locally or remotely, and justify it.",
            "Read a full architecture: browser, frontend, DNS, internet, backend on a cloud server, database.",
          ],
          next: "Module 1 is complete: you can read software architecture diagrams. In Module 2 you will start writing real JavaScript, the language of both the frontend and (with Node.js) the backend.",
        },
      ],
    },
  ],
};

export const m01Lessons: Lesson[] = [l1, l2, l3, l4];
