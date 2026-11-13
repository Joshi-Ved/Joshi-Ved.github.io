/* ------------------------------------------------------------------
   content.js: EVERYTHING the site says lives in this one file.
   To update the website, edit this file only. See UPDATING.md.
   Rules: keep the quotes and commas; a line starting with // is a note.

   PHOTOS: put image files in the "photos" folder using the file names
   written below (or change the names here). A slot whose file is missing
   shows an "Add a photo" box. Set showPhotoSlots to false to hide every
   empty slot once you are done.
------------------------------------------------------------------- */
window.SITE = {

  settings: {
    showPhotoSlots: true
  },

  /* ---------- who I am ---------- */
  profile: {
    name: "Ved Joshi",
    handle: "Blankstar",
    photo: "photos/me.jpg",
    eyebrow: "Mumbai · IT undergrad · builder",
    motto: "Build. Break. Learn. Repeat.",
    intro: "I'm a third-year Information Technology student at VESIT, Mumbai, working across full-stack web, applied machine learning and security. This island is my story. You explore it as the wolf.",
    links: [
      { label: "GitHub", url: "https://github.com/Joshi-Ved" },
      { label: "LinkedIn", url: "https://www.linkedin.com/in/ved-joshi0304" },
      { label: "Email", url: "mailto:vedjoshi0304@gmail.com" }
    ]
  },

  /* ---------- the places on the island ----------
     id: do not change. label: short name on the map. place: name in the world.
     color: the place's colour. wolf: what the wolf says on arrival. */
  chapters: [
    { id: "start", label: "Camp", place: "Base Camp", color: "#ff6b4a", wolf: "This is Base Camp. Lead me anywhere. Every coloured circle is a place." },
    { id: "story", label: "Story", place: "The Den", color: "#f5a524", wolf: "The Den. This is who he is when nobody is grading him." },
    { id: "path", label: "Path", place: "Milestone Trail", color: "#0fa3a3", wolf: "Each signpost is a track he left. The tallest is the newest." },
    { id: "builds", label: "Builds", place: "The Workshop", color: "#7c5cff", wolf: "The Workshop. Walk me up to a pillar and I'll dig up that project." },
    { id: "toolkit", label: "Toolkit", place: "Crystal Grove", color: "#ff4f9a", wolf: "Crystal Grove. Everything he hunts with grows here." },
    { id: "beyond", label: "Beyond", place: "The Summit", color: "#2f7df6", wolf: "The Summit. One flag for every time he showed up and built." },
    { id: "contact", label: "Contact", place: "The Beacon", color: "#e5383b", wolf: "The Beacon. Light it up. He answers." }
  ],

  /* ---------- Story ---------- */
  story: {
    title: "The short version",
    paragraphs: [
      "I'm studying B.E. Information Technology at Vivekanand Education Society's Institute of Technology (University of Mumbai). I like problems that sit between software and the real world: money, food, security, operations.",
      "On campus I'm Vice Chairperson of ISTE VESIT and a college-appointed peer mentor, helping juniors with data structures and career preparation."
    ],
    stats: [
      { value: "9.24", label: "CGPA" },
      { value: "22", label: "public repos" },
      { value: "4", label: "hackathons" },
      { value: "4th", label: "year, B.E. IT" }
    ],
    photos: [
      { src: "photos/story-1.jpg", caption: "On campus" },
      { src: "photos/story-2.jpeg", caption: "With the ISTE VESIT team" }
    ]
  },

  /* ---------- Path (timeline, newest first) ---------- */
  path: {
    title: "Tracks so far",
    items: [
      { when: "Jun 2026 – now", role: "Vice Chairperson", where: "ISTE VESIT", note: "Leading a 45-member council. Flagship events such as Dalal Street and Invictus draw 80 to 90 teams each." },
      { when: "Jun 2025 – Jun 2026", role: "Jr. Operations Officer", where: "ISTE VESIT", note: "Ran events and cross-team coordination." },
      { when: "Nov 2024 – Apr 2025", role: "Jr. Software Developer (intern)", where: "Palcoa Solutions Pvt. Ltd.", note: "Built a salon appointment booking system in a team of four: customer booking flow, staff dashboard, MongoDB backend." },
      { when: "Oct 2024 – Jun 2025", role: "SE Operations Manager", where: "ISTE VESIT", note: "Operations, event planning and digital marketing." },
      { when: "Nov 2023", role: "Cybersecurity internship programme", where: "Teachnook, with Wissenaire IIT (BHU)", note: "First hands-on work with vulnerability assessment and network security." }
    ],
    photos: [
      { src: "photos/path-1.jpeg", caption: "Internship project demo" }
    ]
  },

  /* ---------- Builds (projects) ----------
     Each project becomes a pillar in The Workshop.
     tags: filter buttons. url: "" if the code isn't public.
     status: optional small label. image: optional screenshot. */
  builds: {
    title: "Things I've built",
    hint: "Walk up to a pillar, or pick a project here.",
    items: [
      {
        name: "Fooxchange",
        line: "Recipes from the ingredients you already have.",
        detail: "A recipe exchange platform with food recognition. I trained a YOLOv8n model, exported it to ONNX and run it in the browser, so no image leaves the device. Honest limitation: it still confuses look-alike shapes, which is the next thing to fix.",
        stack: ["TypeScript", "PostgreSQL", "Prisma", "Clerk", "ONNX Runtime Web", "GitHub Actions"],
        tags: ["AI / ML", "Web"],
        image: "photos/fooxchange.jpg",
        url: "https://github.com/Joshi-Ved/Fooxchange"
      },
      {
        name: "TRUST",
        line: "Smart escrow for influencer marketing.",
        detail: "A blockchain-based escrow and transparent settlement platform, so brands and creators both know when and why money is released.",
        stack: ["TypeScript", "Smart contracts"],
        tags: ["Blockchain", "Web"],
        image: "photos/trust.jpg",
        url: "https://github.com/Joshi-Ved/TRUST"
      },
      {
        name: "InvestMitra",
        line: "A trading simulator to practise without real money.",
        detail: "Place trades, track a portfolio and learn how markets move, with nothing at stake.",
        stack: ["TypeScript", "React", "Node.js"],
        tags: ["Fintech", "Web"],
        image: "photos/investmitra.jpg",
        url: "https://github.com/Joshi-Ved/InvestMitra"
      },
      {
        name: "OpsHub",
        line: "A multi-site operations hub, built at Genesis 2.0.",
        detail: "My part of the hackathon build: an offline panic button, per-site data isolation with Postgres row-level security, cross-site search and SLA indicators.",
        stack: ["PostgreSQL", "Row-level security"],
        tags: ["Security", "Web"],
        image: "photos/opshub.jpg",
        url: "https://github.com/gragznotkool/navi.git"
      },
      {
        name: "Savatsya Gau Samvardhan",
        line: "An e-commerce platform for a sustainability cause.",
        detail: "A full MERN storefront: catalogue, cart and orders.",
        stack: ["TypeScript", "MongoDB", "Express", "React", "Node.js"],
        tags: ["Web"],
        image: "photos/savatsya.jpg",
        url: "https://github.com/Joshi-Ved/Savatsya-Gau-Samvardhan"
      },
      {
        name: "yeetcode",
        line: "A Rust CLI that clears junk out of any repo.",
        detail: "An open-source tool I'm planning with teammates: it scans a codebase in any language for unused files and leftovers, so repos stay small and safer.",
        stack: ["Rust"],
        tags: ["Systems"],
        status: "In the works",
        image: "",
        url: ""
      }
    ]
  },

  /* ---------- Toolkit ---------- */
  toolkit: {
    title: "What I work with",
    groups: [
      { name: "Languages", items: ["Java", "Python", "TypeScript", "JavaScript", "C", "Kotlin"] },
      { name: "Web", items: ["React", "Tailwind CSS", "Node.js", "FastAPI", "REST APIs"] },
      { name: "Data", items: ["PostgreSQL", "MongoDB", "MySQL", "Prisma", "Supabase", "Neon"] },
      { name: "AI / ML", items: ["YOLOv8", "ONNX", "PyTorch", "LangGraph"] },
      { name: "Systems", items: ["Linux", "Git", "GitHub Actions"] }
    ],
    learning: ["System design", "Cloud and DevOps", "Rust"]
  },

  /* ---------- Beyond code ---------- */
  beyond: {
    title: "Beyond the code",
    items: [
      { name: "COMMIT 1.0", note: "Top finalist. A bad commit wiped our repo mid-event; we rebuilt it against the clock and still made the final." },
      { name: "Mumbai Hacks 2025", note: "One of 3,500+ hackers. Led the system architecture for an agentic-AI tool that predicts hospital demand." },
      { name: "Nomura KakushIN 10.0", note: "Competed with Team CodeCraft." },
      { name: "Genesis 2.0", note: "Built four modules of OpsHub in a 24-hour sprint." },
      { name: "HABITia'25 podcast", note: "Hosted a conversation with leaders from India's startup ecosystem." }
    ],
    interests: ["Economics and how wealth systems work", "Federated learning", "Volunteering in education", "Hiking and cycling"],
    photos: [
      { src: "photos/beyond-1.jpeg", caption: "Mumbai Hacks 2025" },
      { src: "photos/beyond-2.jpeg", caption: "Hosting at HABITia'25" }
    ]
  },

  /* ---------- Contact ---------- */
  contact: {
    title: "The trail continues",
    text: "I'm always up for a good problem, a hackathon team or a conversation about tech and money. The fastest way to reach me is LinkedIn."
  },

  /* ---------- quick facts the wolf says when tapped ---------- */
  facts: [
    "His motto: build, break, learn, repeat.",
    "He mentors juniors in DSA, and holds a 9.24 CGPA while doing it.",
    "He once lost a whole hackathon repo to one bad commit. Rebuilt it. Made the final.",
    "His food detector runs fully in your browser. No server.",
    "He reads about economics for fun.",
    "He dives in alone first. The pack follows anyway.",
    "He stays calm and looks for the real issue.",
    "He documented his whole switch to Linux, mistakes included.",
    "He is a bit slow when starting but when, his heart is attached he will get it done."
  ]
};
