# PlantCare Advisor

A Vercel-ready plant-care MVP:

- Add lawns, houseplants, trees, hedges, shrubs, and unknown plants.
- Set a location and fetch climate signals from Open-Meteo.
- Generate a maintenance schedule tailored by plant type, season, forecast rainfall, heat, frost, pot/ground, size, age, light, and soil.
- Show source-checked reasoning for maintenance actions.
- Ask an AI chatbot plant-care questions.
- Upload a plant photo and get likely species candidates.

## Files

```txt
.
├── index.html
├── styles.css
├── app.js
├── api
│   ├── chat.js
│   └── identify-plant.js
├── package.json
├── vercel.json
├── .env.example
└── README.md
```

## Deploy to Vercel via GitHub

1. Create a new GitHub repository.
2. Upload all files in this folder to the repository root.
3. In Vercel, choose **Add New Project** and import the GitHub repo.
4. Framework preset: **Other**.
5. Build command: leave blank / default.
6. Output directory: leave blank / default.
7. Add environment variables:
   - `OPENAI_API_KEY` = your OpenAI API key
   - `OPENAI_MODEL` = `gpt-4.1-mini` or another vision-capable model available to you
8. Deploy.

## Run locally

Install the Vercel CLI if needed:

```bash
npm i -g vercel
```

Then:

```bash
cp .env.example .env
# edit .env and add OPENAI_API_KEY
vercel dev
```

Open the local URL shown by Vercel.

## Notes

- Plant and schedule data is stored in the user's browser localStorage only.
- OpenAI API calls run through Vercel serverless functions, so your API key is not exposed to the browser.
- The evidence layer is a curated source/rule registry. For a production-grade system, replace it with a retrieval system that cites exact passages from controlled sources per species and location.
- Image identification is probabilistic. The app returns candidates and confidence rather than a single definitive answer.
