# Narration voice: which text-to-speech to pay for (if any)

*Researched and checked on **9 October 2026**, then re-checked independently the same day (prices,
licences, YouTube rules and our pipeline settings). Prices are in US dollars. UK VAT may be added on top.*

> **How sure is this?** Our build machine can't open most websites, so I couldn't read the
> companies' pricing pages myself. Every number below comes from web searches of those official
> pages plus independent write-ups, and I compared several sources for each one. Anything I
> couldn't confirm is marked **(unverified)**. Prices in this market change every few weeks, so
> **check the price on the day you subscribe.**

---

## The short version

1. **Keep using the free voice (Kokoro) while we build.** It's free, runs on our own machine, and
   its licence allows a monetised channel. It's good enough for timing the animation, but it
   sounds flatter than the paid voices.
2. **Before you pay anything, we run an audition.** I'll generate the same 20-second paragraph with
   the three voices below, using their free trials, and you pick by ear. (That's check-in 2 in
   the channel rules.)
3. **My recommendation for the final voice:**
   - **First choice: ElevenLabs "Eleven v4", Creator plan.** $22 a month, and $11 for the first
     month. It's the most natural-sounding voice on the main independent leaderboard right now,
     it has British narrator voices, and the licence is simple: on any paid plan you can use the
     audio commercially with no credit line. (Its old standard British voices, like "George", are
     being retired on 31 Dec 2026, so we'd pick a current one or design our own.)
   - **Best value: Google "Gemini 3.8 Flash TTS".** It sounds almost as natural, and at our volume
     it costs **under $1 a month** on pay-as-you-go. The catches: you get a British accent by
     describing the voice you want, so we have to listen and check it, and it needs a small
     addition to our pipeline (our current Google setting uses Google's older voices).
   - **Good cheap subscription: Cartesia "Sonic 3.6", Pro plan.** $5 a month, comes with a
     commercial licence and named British voices (e.g. "Gemma", "Archie"). It needs a small
     addition to our pipeline before we can use it.
4. **YouTube is fine with an AI narrator.** A channel with an AI voice can be monetised. What
   YouTube demonetises is mass-produced, repetitive "template" content, and our original
   animation and fact-checked scripts are the opposite of that. The "altered or synthetic
   content" label is **not required** for a made-up narrator voice over obviously animated
   diagrams. We'll still add one honest line to every description: *"Narration: AI voice."*

---

## What "natural-sounding" means here

The best independent measure is the **Artificial Analysis Speech Arena**. Members of the public
hear two voices reading the same text without knowing which company made them, and they vote
for the one that sounds better. The votes become a score called "Elo", where higher is better.
As a rough guide, a gap of **40+ points** is a clear preference. A gap of **under ~20 points** is
basically a tie.

It has three boards that matter to us:

- **Provider Voice:** each company's own best voices.
- **Controlled Voice:** every model is made to copy the *same* eight voices, **four of them
  British**. This is the fairest model-against-model test.
- **Pronunciation robustness:** how often each model reads tricky words correctly. That matters
  for words like "denatured" and "enzyme–substrate".

The boards change every week. These are the readings for late September to early October 2026:

| Model | Provider Voice board | Controlled Voice board | Notes |
|---|---|---|---|
| **ElevenLabs Eleven v4** (launched 28 Sep 2026) | **#1, about 1,320 Elo** | #2, about 1,157 | Artificial Analysis also has it **#1 on pronunciation**. |
| Cartesia Sonic 3.6 | about 1,276–1,281 (it was #1 before v4 launched) | #4, about 1,138 | A July snapshot of the British-voices-only results had the earlier Sonic 3.5 on top. |
| Google Gemini 3.8 Flash TTS (launched 23 Sep 2026) | about 1,260–1,275 | not found | It was #1 on pronunciation (89.5%) when it launched, until v4 arrived. |
| Inworld Realtime TTS-2 | about 1,252 | #3, about 1,145 | Built for live voice assistants. |
| Alibaba Qwen-Audio-3.1-TTS-Plus | **unclear**: one Artificial Analysis page shows about 1,294 without saying which board, and reports say 3.1 is only on Controlled Voice (**unverified**) | **#1, about 1,178–1,184** | Price, British voices and licence terms all **unverified** (see below). |
| ElevenLabs Eleven v3 (previous model) | about 1,169–1,175 (#14–18, secondary snapshots) | — | v4 replaced it. |
| OpenAI gpt-4o-mini-tts | **far down the board** in older snapshots (about #26–35, roughly 1,045–1,055 Elo); current rank **unverified** | — | OpenAI's older tts-1-hd was reportedly about #28. |

I also tried the community **TTS Arena v2** on Hugging Face, but couldn't get its current rankings
**(unverified)**.

---

## Comparison table

Our usage is about 6 videos a month × 5 minutes, which is **about 30 minutes, or about 25,000
characters, a month**. In practice we also re-record a few lines per episode, so plan for
**40,000–60,000 characters a month**.

| Option | How natural | British voices? | What we'd pay a month | Unit price | Monetised YouTube allowed? | Credit / disclosure rules | Cloning real people |
|---|---|---|---|---|---|---|---|
| **ElevenLabs Eleven v4** | Best right now (see above) | **Yes**, but the old standard British voices ("George", "Alice", "Lily", "Daniel") are only on accounts made before March 2026 and stop working on **31 Dec 2026**. Their suggested replacements (e.g. "Eldrin", a British baritone) are in the Voice Library with thousands of others, and we can design our own. | **Starter $6** (30,000 credits: only just covers us, with no room for re-takes) or **Creator $22** (121,000 credits, $11 first month) | ElevenLabs' docs say text-to-speech costs 1 credit per character (the v4 rate on plans is **unverified**). API: **$0.08 per 1,000 characters** from 12 Oct 2026 ($0.022 during the launch discount until then). Sources disagree on whether older models are now $0.08 or $0.10 per 1,000. | **Yes, on any paid plan.** The free plan is non-commercial only. Audio made while you're subscribed stays usable indefinitely, even if you cancel later. (Audio from features labelled "beta" can't be used commercially; v4 isn't labelled beta.) | Paid plans: no credit line needed. Free plan: must credit "elevenlabs.io". Their rules ban using the audio to deceive or defraud people. (A specific "must say it's AI" rule: **unverified**.) | Only voices you have the rights and consent for. Some well-known, especially political, voices are blocked ("no-go voices"). |
| **Google Gemini 3.8 Flash TTS** | Very close behind (within ~45–55 Elo) | **By description:** you design a voice by describing it, accent included, or pick from 2,000+ ready-made voices. Changing a ready-made voice's accent by prompt is reportedly "coming soon". How good its British accent is: **unverified**, so we must audition it. | **About $0.40** for 30 minutes of audio. That rises to about $0.81 from 1 Jan 2027 when Google doubles the rate. (One independent test found real bills about 30% higher than this maths.) | Pay-as-you-go: about **$0.0135 per minute** of audio (about $16.50 per million characters). | **Yes.** Google says it doesn't claim ownership of what you generate. You're responsible for how you use it. | No credit line. Every clip carries Google's inaudible "SynthID" AI watermark, which is harmless for us. | Voice copying needs consent checks, and it's reportedly not offered in AI Studio in the UK, EU, Switzerland or India. |
| **Cartesia Sonic 3.6** | Top 3 | **Yes:** "Gemma" (female), "Archie" (male), "Benedict" (narration) and others | **Pro $5** (100,000 credits, about 4× what we need) | About $50 per million characters (Artificial Analysis's estimate; Cartesia doesn't publish a per-model rate) | **Yes, on paid plans** (Pro and up). The free plan isn't licensed for commercial use. | No credit line found. Their privacy policy says they may use generated audio to train their models; there's an opt-out form. | Verified consent required for every copied voice. Impersonation is banned. |
| Google Cloud TTS **Chirp 3 HD** (Google's older engine; **what our pipeline's `google` setting uses today**) | Good. Its rank is **unverified**. | Yes, British English is supported. | **$0:** the first 1 million characters a month are free. | $30 per million characters after that | Yes. A Google forum answer says no credit line is needed (**not official**). | — | Custom voices have extra terms. |
| OpenAI gpt-4o-mini-tts | Well behind the leaders | **Weak.** The default accent is American, and asking for British is unreliable (users report). | About $0.45 | About $0.015 per minute | Yes (OpenAI terms, not re-checked) | OpenAI's TTS guide says you must clearly tell listeners the voice is AI-generated (read via search results). | Custom voices need the speaker's consent. |
| Microsoft Azure Neural HD | Mid-table (**unverified**) | Yes, many British English neural voices. British HD voices are **unverified**. | About $0.55, possibly $0 (500,000 free neural characters a month; whether HD voices count is **unverified**) | $22 per million characters (cut from $30 in March 2026) | Yes (**unverified**) | — | Custom Neural Voice needs approval. |
| Hume Octave 2 | Mid-table (**unverified**) | Through voice design | Creator **$14** (140,000 characters) | — | Creator ($14) and up. Several guides say the $3 Starter plan is non-commercial (**unverified** on Hume's own site). | — | Consent required |
| Inworld Realtime TTS-2 | Top 4 | **Unverified** | About $0.63 | $25 per million characters on demand | **Unverified** | — | — |
| MiniMax Speech 2.8 HD | **Unverified** | **Unverified** | About $2.50 | $100 per million characters | **Unverified:** I couldn't find their terms. | — | $1.50 per copied voice |
| Alibaba Qwen-Audio-3.1 TTS | #1 on Controlled Voice | **Unverified** | **Unverified** | **Unverified** | **Unverified** | — | — |
| **Kokoro-82M (what we use now)** | Clearly behind the paid leaders: flatter, with the odd wrong stress (my judgment) | **Yes, 8 voices** in our copy: bf_alice, bf_emma, bf_isabella, bf_lily, bm_daniel, bm_fable, bm_george, bm_lewis | **$0** | Free, runs on our machine | **Yes.** It's **Apache-2.0** (I confirmed this from the official GitHub licence file and README: "Apache-licensed weights"). The kokoro-onnx wrapper we use is MIT-licensed. | No credit line needed for the audio | Not applicable (no cloning) |

---

## Why these three

**1. ElevenLabs Eleven v4 (Creator plan): best sound, simplest licence.**

- It's the top model on the independent Provider Voice board, #2 on the fairer Controlled Voice
  board, and #1 for pronunciation. Pronunciation matters on a science channel.
- It has real British narrator voices to choose from (or we design one), with no accent tricks
  needed.
- It reads up to 10,000 characters in one go, so each scene comes out as a single, consistent
  take.
- It accepts acting directions in the text (e.g. a short pause or a lighter tone), which helps
  the "pause and predict" moment.
- **Weaknesses:**
  - It's the most expensive option.
  - The model is brand new, only 11 days old, so the rankings could still move.
  - Starter ($6) only just covers us. Use Creator so re-takes don't run out.
  - The old standard British voices (George, Alice, Lily, Daniel) aren't offered to accounts
    made after March 2026 and stop working on 31 Dec 2026. Their replacements are Voice Library
    voices, which the voice's owner can withdraw (with warning, if the voice has a "notice
    period"; audio already made stays usable). Safest: a voice with a long notice period, or our
    own voice made with ElevenLabs' Voice Design.
  - ElevenLabs' docs say text-to-speech costs 1 credit per character, but whether v4 is exactly
    that on subscriptions is **unverified**. We'll see on the credit counter after the first test.
  - Our pipeline uses ElevenLabs' older model unless `.env` says `ELEVENLABS_MODEL=eleven_v4`
    (included in the sign-up steps below).

**2. Google Gemini 3.8 Flash TTS: nearly as good for about 1/20th of the price.**

- It's within roughly 50 Elo of the leader and very strong on pronunciation.
- It's pay-as-you-go, so a quiet month costs almost nothing.
- **Weaknesses:**
  - The British accent comes from describing the voice, so we need to hear it first.
  - **It isn't wired into our pipeline yet.** Our `google` setting currently uses Google's older
    Chirp 3 HD voices, so Gemini needs a small addition, like Cartesia.
  - Setting up Google billing is a little fiddly.
  - On the free tier Google may use your text to improve its products. Google's terms say users
    in the UK, EEA or Switzerland get the paid-tier data rules even for free. We'd switch on
    billing anyway.
  - One developer reports a limit of about 100 requests a day that **didn't go up** after
    turning on billing. That's fine for us, because one episode is about 10–15 requests.

**3. Cartesia Sonic 3.6 (Pro plan): cheapest subscription with a licence.**

- For $5 you get a commercial licence and named British voices, and quality is top 3.
- **Weaknesses:**
  - It's designed mainly for live voice assistants, not long narration.
  - Their claims about how good their British voices are come from their own tests.
  - Cartesia may use generated audio to train its models (there's an opt-out form).
  - **It isn't wired into our pipeline yet**: it would need two new settings, `CARTESIA_API_KEY`
    and `CARTESIA_VOICE_ID`.

**Not picked:**

- **OpenAI:** a weak British accent, an extra AI-disclosure rule, and it's not near the top of
  the leaderboard.
- **Azure:** more set-up and no quality advantage.
- **Hume, Inworld, MiniMax and Qwen:** I couldn't confirm their licence terms or British voices,
  and none of them clearly beats the three above.

---

## Exactly what to sign up for

Your keys go **only** in the `.env` file in the project folder. Never paste them into a chat, an
email or the code.

### If you choose ElevenLabs (recommended)

1. Create a free account at **elevenlabs.io** and listen to British voices in the Voice Library
   (e.g. "Eldrin"), or try Voice Design. (George, Alice, Lily and Daniel won't appear on a new
   account.) Free-plan audio is for auditioning only, **not for publishing**.
2. Subscribe to **Creator** ($11 first month, then $22). Starter ($6) works if you're happy with
   tight limits. **The subscription must be active when we make the final narration.**
3. Profile → **API Keys** → create a key. If it lets you choose permissions, "Text to Speech" is
   enough.
4. Open your chosen voice → copy its **Voice ID**.
5. Fill in `.env`:
   ```
   TTS_PROVIDER=elevenlabs
   ELEVENLABS_API_KEY=<your key>
   ELEVENLABS_VOICE_ID=<the voice ID>
   ELEVENLABS_MODEL=eleven_v4
   ```
   (Without the last line our pipeline uses ElevenLabs' older Multilingual v2 model.)

### If you choose Google Gemini (best value)

1. Go to **aistudio.google.com** → sign in → **Get API key** → create a key.
2. Turn on billing for the Google Cloud project attached to that key. This gets you the paid
   tier, so your scripts aren't used to train Google's models (if you live in the UK, Google's
   terms say that's already true on the free tier). One user reports the ~100-a-day limit
   didn't go up with billing. **Set a budget alert of $5** so nothing can surprise you.
3. **Tell me, and I'll add Gemini to the pipeline.** It isn't wired in yet: today
   `TTS_PROVIDER=google` calls Cloud TTS **Chirp 3 HD** (voice `en-GB-Chirp3-HD-Aoede`), which
   needs a Google Cloud key with the "Text-to-Speech API" turned on, not an AI Studio key.
   (Note for the pipeline: Gemini uses a *Gemini API* key and the model `gemini-3.8-flash-tts`,
   confirmed in Google's docs. Give it its own `.env` setting so it can't be confused with the
   Chirp key.)

### If you choose Cartesia

Sign up at **cartesia.ai** → Pro plan ($5) → create an API key → tell me. I'll add Cartesia to the
pipeline and the two new `.env` settings.

### OpenAI (not recommended, listed for completeness)

Go to platform.openai.com → add prepaid credit → create an API key, then set
`TTS_PROVIDER=openai` and `OPENAI_API_KEY=<your key>`.

### Staying free

Leave `TTS_PROVIDER=kokoro` and `KOKORO_VOICE=bf_emma`, or another British voice from the list
above.

**Changing voice later is safe.** When you switch provider, we simply run the narration and
alignment steps again. The animation is timed to cue words, not to fixed seconds, so it follows
the new voice automatically. The voice is never sped up or stretched to fit.

---

## YouTube's rules on AI voices

**Can we earn money with an AI narrator?** Yes. YouTube doesn't ban AI voices. Its rule is about
**"inauthentic content"**. That's the new name, from **15 July 2025**, for the old "repetitious
content" rule. It covers mass-produced or repetitive videos, for example near-identical template
videos, or slideshows that all have the same narration. YouTube's creator liaison called the
change a "minor update"; this kind of content was already ineligible. (The rename is reported by
YouTube's liaison and the press; I couldn't open the policy page itself.)

We stay well clear of it because:

- every episode has an original, fact-checked script;
- every episode has custom animation;
- we use a clear teaching structure;
- there's no recycled footage, and all our visuals and music are our own (the "reused content"
  rule doesn't touch us).

An expressive voice, rather than a flat robotic one, also helps.

**Do we need the "altered or synthetic content" label?**

- YouTube requires it for **realistic** content a viewer could mistake for real. Its examples
  are:
  - making a **real person** appear to say or do something they didn't, including
    "synthetically generating a person's voice to narrate a video" and cloning *someone else's*
    voice;
  - altering footage of real events or places;
  - realistic scenes that never happened.
- It is **not** required for clearly unrealistic or **animated** content, or for using AI as a
  production tool.
- So a made-up narrator voice that doesn't imitate a real person, over obviously animated
  diagrams, **does not need the label**. This is my reading of YouTube's own blog post and of
  guides that quote its Help Center. I couldn't open the Help Center page itself from here.

What we'll do:

- In YouTube Studio, answer **"No"** to the altered-content question.
- Add **"Narration: AI voice (provider name)."** to every description. It's honest, it costs
  nothing, it matches ElevenLabs' no-deception rule, and it satisfies OpenAI's disclosure rule if
  we ever use them.
- **If we ever use a copy of someone else's real voice**, we answer **"Yes"**. (YouTube reportedly
  exempts cloning your own voice.) Never imitate a famous narrator.

Two more things:

- Reports say disclosing doesn't reduce monetisation. Repeatedly failing to disclose when it's
  required can lead to penalties, up to suspension from the Partner Program.
- Since about late May 2026, YouTube has also **added AI labels automatically**, using Google's
  SynthID watermarks and other provenance data. Reports say this is aimed at photorealistic
  video. I found no evidence it targets narration **(unverified)**. Gemini audio carries a SynthID
  watermark, so a label is possible but unlikely, and it wouldn't affect earnings.

---

## Sources (all checked 9 Oct 2026)

**Independent rankings**
- Artificial Analysis TTS leaderboards (main, Provider Voice, Controlled Voice, methodology):
  https://artificialanalysis.ai/text-to-speech/leaderboard ·
  https://artificialanalysis.ai/text-to-speech/leaderboard/provider-voice ·
  https://artificialanalysis.ai/text-to-speech/leaderboard/controlled-voice ·
  https://artificialanalysis.ai/methodology/text-to-speech
- Artificial Analysis announcement, Eleven v4 #1 on Provider Voice and pronunciation, #2 on Controlled Voice: https://x.com/ArtificialAnlys/status/2104578736687653293
- Artificial Analysis announcement, Gemini 3.8 Flash TTS: https://x.com/ArtificialAnlys/status/2102784197853380647
- Controlled Voice launch, including the July British-voices results (secondary): https://x.com/WesRoth/status/2075248621797384271 · https://x.com/ArtificialAnlys/status/2074886571166462405
- Elo snapshots (secondary, a reseller blog): https://www.orcarouter.ai/blog/eleven-v4-tops-the-voice-arena · https://www.orcarouter.ai/blog/inworld-realtime-tts-2-tops-controlled-voice-arena
- September ranking snapshot (secondary): https://www.digitalapplied.com/blog/best-text-to-speech-models-september-2026-ranked-priced · https://speechify.ai/blog/simba-3-tops-artificial-analysis-tts-leaderboard
- Hugging Face Open TTS Leaderboard (objective metrics, not listening votes): https://huggingface.co/blog/open-tts-leaderboard

**ElevenLabs**
- Eleven v4 launch: https://elevenlabs.io/blog/eleven-v4 · https://www.unite.ai/elevenlabs-launches-eleven-v4-with-low-latency-turbo-variant/
- Pricing (official pages, read through search): https://elevenlabs.io/pricing · https://elevenlabs.io/pricing/api
- v4 price and launch discount: https://www.eesel.ai/blog/eleven-v4 · https://www.eesel.ai/blog/eleven-v4-pricing
- Plan comparisons (secondary): https://www.cartesia.ai/learn/elevenlabs-pricing · https://flexprice.io/blog/elevenlabs-pricing-breakdown · https://bigvu.tv/blog/elevenlabs-pricing-2026-plans-credits-commercial-rights-api-costs/
- Commercial use (official help centre): https://help.elevenlabs.io/hc/en-us/articles/13313564601361-Can-I-publish-the-content-I-generate-on-the-platform
- No-go voices: https://elevenlabs.io/docs/help-center/legal/what-are-no-go-voices
- Voice Library notice period: https://elevenlabs.io/docs/help-center/product/voices/voice-library/what-is-a-notice-period
- British voice names (secondary): https://voximplant.com/docs/references/voxengine/voicelist/elevenlabs

**Google**
- Gemini 3.8 TTS launch: https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-8-text-to-speech/
- Gemini API pricing: https://ai.google.dev/gemini-api/docs/pricing · https://www.eesel.ai/blog/gemini-3-8-flash-tts-pricing · https://neomanex.com/news/gemini-3-8-flash-tts-flash-lite-tts-api-pricing
- Gemini API terms (ownership, UK/EEA paid-services rule): https://ai.google.dev/gemini-api/terms
- Daily request limit report (user report): https://note.com/ebibibi/n/nc42becd7e7de?hl=en
- Cloud TTS pricing and Chirp 3 HD: https://cloud.google.com/text-to-speech/pricing · https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd
- Cloud TTS attribution (forum, not official): https://discuss.google.dev/t/text-to-speech-api-license/187973

**Cartesia**
- Sonic 3.6 docs, changelog and blog: https://docs.cartesia.ai/build-with-cartesia/tts-models/latest · https://docs.cartesia.ai/changelog/2026 · https://www.cartesia.ai/blog/sonic-3.6
- British voices: https://www.cartesia.ai/voices/british-accent
- Pricing and terms: https://www.cartesia.ai/pricing · https://www.cartesia.ai/legal/terms · https://www.cartesia.ai/legal/acceptable-use · https://www.cartesia.ai/legal/privacy · https://www.eesel.ai/blog/cartesia-sonic-3-pricing

**Others**
- OpenAI TTS guide: https://developers.openai.com/api/docs/guides/text-to-speech
- OpenAI British accent forum thread: https://community.openai.com/t/british-accent-and-pronuciation-in-gpt-4o-mini-tts/1150812
- OpenAI price estimate (secondary): https://costgoat.com/pricing/openai-tts
- OpenAI 2026 voice releases: https://techcrunch.com/2026/07/08/openai-releases-new-voice-models-for-more-natural-live-conversations/
- Azure HD price cut: https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/azure-speech-%E2%80%93-neural-hd-text-to-speech-recent-voice-updates/4505380 · https://azure.microsoft.com/en-us/pricing/details/speech/
- Hume pricing (secondary, conflicting): https://fish.audio/vs/pricing/hume-ai/ · https://cognitivefuture.ai/hume-ai-octave-review/
- Inworld pricing: https://inworld.ai/tts-api · https://www.therundown.ai/tools/inworld-tts
- MiniMax pricing: https://platform.minimax.io/docs/pricing/overview
- Qwen-Audio 3.x: https://the-decoder.com/alibabas-qwen-audio-3-0-tts-plus-tops-the-competition-in-the-text-to-speech-rankings/ · https://alphasignal.ai/news/alibaba-s-qwen-audio-3-1-slashes-voice-api-prices-by-up-to-95

**Kokoro (free, current)**
- Licence file (Apache-2.0) and README ("Apache-licensed weights"), read directly: https://github.com/hexgrad/kokoro/blob/main/LICENSE · https://github.com/hexgrad/kokoro
- kokoro-onnx wrapper (MIT; model Apache-2.0): https://github.com/thewh1teagle/kokoro-onnx
- British voice list: read directly from our local `models/kokoro/voices-v1.0.bin`.

**YouTube**
- Official blog, altered or synthetic content: https://blog.youtube/news-and-events/disclosing-ai-generated-content/
- Help Center page (couldn't be opened from here; quoted by the guides below): https://support.google.com/youtube/answer/14328491
- Secondary guides: https://9to5google.com/2024/03/18/youtube-altered-content-disclosure/ · https://vois.so/blog/youtube-ai-voice-disclosure-rules · https://narrationbox.com/blog/youtube-ai-voice-policy-explained-clearly
- Inauthentic-content rule (July 2025): https://ppc.land/youtube-clarifies-inauthentic-content-policy-changes/ · https://www.socialmediatoday.com/news/youtube-clarifies-monetization-update-inauthentic-repeated-content/752892/ · https://routenote.com/blog/youtube-updates-repetitive-content-policy/
- Automatic AI labels (2026, secondary): https://www.creatorhandbook.net/youtube-expands-automatic-ai-labeling-system/ · https://chatforest.com/builders-log/youtube-ai-auto-labeling-c2pa-synthid-builder-guide/
