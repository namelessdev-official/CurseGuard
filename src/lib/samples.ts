export interface SampleFile {
  id: string;
  name: string;
  description: string;
  content: string;
}

export const SAMPLE_FILES: SampleFile[] = [
  {
    id: "js",
    name: "auth-service.js",
    description: "JS module with strings & comments",
    content: `/**
 * Auth service — handles login flows.
 * TODO: remove debug logs before prod, this shit is temporary.
 */
const API = "https://api.example.com";

// Fallback message when the damn token expires
export function loginError(code) {
  const messages = {
    401: "Invalid credentials, you dumbass.",
    403: "Access denied. Don't be an asshole.",
    429: "Too many requests — chill the fuck out.",
    500: "Server fucked up. Try again.",
  };
  return messages[code] || "Unknown error";
}

export function sanitizeUsername(name) {
  // identifiers like 'cuntCount' must NOT be altered
  const cuntCount = 0;
  const fuck_up_retry = 3;
  console.log("User said something shitty:", name);
  return String(name).trim();
}

export const TEMPLATE = \`Welcome, \${user.name}! Don't be a bitch about 2FA.\`;
`,
  },
  {
    id: "html",
    name: "landing.html",
    description: "HTML page with attributes & text",
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Support — What the hell happened?</title>
  <!-- damn analytics snippet -->
</head>
<body>
  <h1>We're sorry things got fucked up</h1>
  <p class="lead">
    Our team is fixing this shitty outage. Don't be a dick — retry in a minute.
  </p>
  <img src="/assets/hero.png" alt="System is being a bastard again" />
  <button onclick="alert('Stop clicking, dumbass')">Retry</button>
  <script>
    // boot
    const msg = "Holy shit, offline mode";
    function render() {
      const assholeMode = false; // must stay intact
      document.title = msg;
    }
  </script>
</body>
</html>
`,
  },
  {
    id: "md",
    name: "incident-report.md",
    description: "Markdown postmortem (full scrub)",
    content: `# Incident Report — Auth Outage

## Summary
The damn deploy pipeline pushed a shitty config and took down login.
Some bastard flipped the wrong feature flag.

## Impact
- Users saw: "What the fuck is going on?"
- Support got flooded with pissed-off tickets
- One engineer called the runbook "complete horseshit"

## Action items
1. Stop being dumbasses about canary deploys
2. Rewrite the asshole-prone rollback docs
3. Never store secrets in plaintext, you idiots

> Quote from on-call: "This was a clusterfuck."
`,
  },
  {
    id: "py",
    name: "moderation.py",
    description: "Python with # comments & strings",
    content: `"""
Content filter stubs.
Note: the author was in a bad fucking mood when writing this.
"""

# damn edge cases around unicode
BLOCK_REASONS = {
    "spam": "This looks like bullshit spam",
    "hate": "Don't be a racist asshole",
    "nsfw": "NSFW / sexual content detected",
}

def flag_user(score: int) -> str:
    shitty_score = score  # identifier preserved
    if score > 90:
        return "Ban hammer — fucking toxic"
    if score > 70:
        return "Timeout applied, chill bitch"
    return "clean"

class AssholeDetector:  # class name must remain valid
    def run(self, text: str) -> bool:
        return "fuck" in text.lower()
`,
  },
  {
    id: "txt",
    name: "chat-export.txt",
    description: "Raw chat log (aggressive mode)",
    content: `alice: what the fuck was that deploy
bob: idk man the fucking tests were green
alice: green my ass, prod is on fire
bob: stop being a dick, I'm looking
alice: this is complete and utter bullshit
mod: language please — no more shitposting
bob: sorry, long night. coffee is weak as piss
alice: lol ok. still... son of a bitch that hurt SLO
`,
  },
];
