# Graph Report - prepify  (2026-05-11)

## Corpus Check
- 40 files · ~24,062 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 85 nodes · 101 edges · 7 communities detected
- Extraction: 83% EXTRACTED · 17% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]

## God Nodes (most connected - your core abstractions)
1. `generateQuestionItem()` - 8 edges
2. `seed()` - 7 edges
3. `getDb()` - 6 edges
4. `apiSend()` - 5 edges
5. `summarizeTopic()` - 5 edges
6. `validateGeneratedQuestionPayload()` - 4 edges
7. `createDb()` - 4 edges
8. `loadPracticeBankFromRepo()` - 4 edges
9. `apiBase()` - 4 edges
10. `calculateAttemptOutcome()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `validateGeneratedQuestionPayload()` --calls--> `generateQuestionItem()`  [INFERRED]
  packages/shared/src/generated-question.ts → apps/worker/src/activities.ts
- `createDb()` --calls--> `buildServer()`  [INFERRED]
  packages/db/src/index.ts → apps/api/src/server.ts
- `createDb()` --calls--> `getDb()`  [INFERRED]
  packages/db/src/index.ts → apps/worker/src/activities.ts
- `applyActiveDecay()` --calls--> `syncAttemptClock()`  [INFERRED]
  packages/shared/src/attempt-timer.ts → apps/api/src/attempt-service.ts
- `scaledScoreFromAccuracy()` --calls--> `calculateAttemptOutcome()`  [INFERRED]
  packages/shared/src/scoring.ts → apps/api/src/attempt-service.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.23
Nodes (10): createDb(), domainCodeForPracticeQuestion(), expandPracticeBank(), letterToPosition(), loadPracticeBankFromRepo(), parsePracticeAnswersMarkdown(), parsePracticeQuestionsMarkdown(), forceReplaceQuestionBank() (+2 more)

### Community 1 - "Community 1"
Cohesion: 0.21
Nodes (8): calculateAttemptOutcome(), scoreAttempt(), shuffleInPlace(), startAttempt(), syncAttemptClock(), applyActiveDecay(), passesExam(), scaledScoreFromAccuracy()

### Community 2 - "Community 2"
Cohesion: 0.31
Nodes (7): pause(), resume(), saveAnswer(), apiBase(), apiGet(), apiSend(), formatApiError()

### Community 3 - "Community 3"
Cohesion: 0.44
Nodes (7): failJob(), generateQuestionItem(), getDb(), recordUsage(), roleConfig(), summarizeTopic(), generateQuestionWorkflow()

### Community 4 - "Community 4"
Cohesion: 0.38
Nodes (3): isRecord(), validateGeneratedQuestionPayload(), validateQuestionStructure()

### Community 5 - "Community 5"
Cohesion: 0.67
Nodes (2): buildServer(), corsOriginOption()

### Community 6 - "Community 6"
Cohesion: 0.83
Nodes (3): mockRawPayload(), openAiRawPayload(), runQuestionGenerationModel()

## Knowledge Gaps
- **Thin community `Community 5`** (4 nodes): `main.ts`, `server.ts`, `buildServer()`, `corsOriginOption()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createDb()` connect `Community 0` to `Community 3`, `Community 5`?**
  _High betweenness centrality (0.255) - this node is a cross-community bridge._
- **Why does `getDb()` connect `Community 3` to `Community 0`?**
  _High betweenness centrality (0.184) - this node is a cross-community bridge._
- **Why does `buildServer()` connect `Community 5` to `Community 0`?**
  _High betweenness centrality (0.165) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `generateQuestionItem()` (e.g. with `generateQuestionWorkflow()` and `runQuestionGenerationModel()`) actually correct?**
  _`generateQuestionItem()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `seed()` (e.g. with `createDb()` and `loadPracticeBankFromRepo()`) actually correct?**
  _`seed()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `apiSend()` (e.g. with `saveAnswer()` and `pause()`) actually correct?**
  _`apiSend()` has 3 INFERRED edges - model-reasoned connections that need verification._