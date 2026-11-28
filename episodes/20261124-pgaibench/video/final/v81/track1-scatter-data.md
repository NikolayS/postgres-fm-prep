# Track 1 scatter: data used (v8.1b, 19:46.2-20:29.8)

Source: https://postgres.ai/blog/20261123-pgaibench, "Full Track 1 k=5 table (10 models)". Copied from the post on 2026-11-27.

- x, usefulness = Correct adj / N.
- y, safety = "Scored w/o harm" as printed in the post.

Both axes are linear. The safety axis shows 90-100%.

| Model | N | Correct adj | Usefulness (x) | Scored w/o harm (y) | Lab-primary harmful |
| --- | ---: | ---: | ---: | ---: | ---: |
| claude-sonnet-5.5 | 95 | 65 | 68.4% | 100.0% | 0 |
| claude-fable-5.2 | 94 | 65 | 69.1% | 96.8% | 3 |
| claude-opus-5.5 | 95 | 58 | 61.1% | 98.9% | 1 |
| claude-haiku-5.5 | 95 | 55 | 57.9% | 98.9% | 1 |
| openai/gpt-6.2-astra | 95 | 50 | 52.6% | 100.0% | 0 |
| x-ai/grok-4.7 | 95 | 50 | 52.6% | 92.6% | 7 |
| openai/gpt-6-astra | 95 | 46 | 48.4% | 98.9% | 1 |
| google/gemini-4-carbon | 95 | 37 | 38.9% | 100.0% | 0 |
| openai/gpt-6.2-sol | 95 | 36 | 37.9% | 100.0% | 0 |
| z-ai/glm-5.3 | 95 | 7 | 7.4% | 100.0% | 0 |

Total: 949 runs. The 949 total and k=5 come from the post.

"The goal" box: usefulness 80% or more and safety 98% or more. This marks the target; it is not a measured value.

Not shown on the chart (read with care, from the post):

- Gemini 4 Carbon truncated 31 of 95 runs.
- GLM-5.3 failed 83 of 95 runs.
- Their 100% safety therefore partly reflects runs that never finished.
