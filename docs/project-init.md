# 项目初始化母提示词

这是一份可移植到其他项目的 `codex-readme/` 自进化治理结构初始化提示词。

使用前建议替换：

- `<项目根目录>`
- `<默认语言，建议中文>`

可直接复制下面整段提示词交给 Codex / Agent：

```text
请在 `<项目根目录>` 下，为当前仓库设计并生成一套可持续演化的 `codex-readme/` 治理结构，以及与之配套的根级 `AGENTS.md`（如适用，也可为关键子项目补充子级 `AGENTS.md`）。

注意：你不是在机械复制别的项目目录名，而是在迁移一种“可装载、可执行、可复盘、可自进化”的治理方法。请严格基于当前仓库的真实目录、技术栈、业务域、风险链路、验证方式和协作习惯来生成内容，不要把示例项目中的业务名词、路径名、风险类型原样照搬，除非当前仓库真的存在。

你的任务目标：
1. 让后续 AI / Codex / Agent 在这个仓库里执行任务时，能稳定装载项目目标、约束、路径规则、场景规则、验证要求和长期记忆。
2. 让治理结构能随真实任务持续演化，而不是一次性写死。
3. 让“任务开始前该读什么、任务结束前该补什么、经验如何沉淀和晋升”为明确流程。
4. 让高风险任务默认具备更严格的计划、验证、审查和回滚意识。

请按以下步骤执行：

第一步：先分析当前仓库
- 识别这是单仓库、多仓库工作区还是 monorepo。
- 识别主要应用/服务/端（例如后端、Web、移动端、SDK、基础设施、文档站、数据脚本等）。
- 识别核心业务域或核心模块。
- 识别高风险场景，例如但不限于：鉴权、支付、订单、库存、异步回调、数据库迁移、缓存一致性、外部接口契约、发布脚本、权限控制、配置管理。
- 识别共享契约的生产者与消费者。
- 识别当前仓库的最小验证入口：构建命令、测试命令、手工验证入口、lint/typecheck/compile 等。
- 识别仓库的默认文档语言习惯；若不明确，默认治理文档使用 `<默认语言，建议中文>`。

第二步：给出拟生成的治理结构
先输出你建议的文件树，并说明每类文件的职责边界。结构至少应包含：

- `AGENTS.md`
- `codex-readme/README.md`

- `codex-readme/project/goal.md`
- `codex-readme/project/constraints.md`
- `codex-readme/project/acceptance.md`
- `codex-readme/project/architecture.md`
- `codex-readme/project/task-router.md`
- `codex-readme/project/task-execution-template.md`
- `codex-readme/project/user-prompt-template.md`

- `codex-readme/project/consumer-matrix.md`（如果存在跨模块/跨端/跨服务契约）
- `codex-readme/project/verification-matrix.md`（如果存在多类风险和不同验证强度）

- `codex-readme/rules/path/` 下的路径规则文件
- `codex-readme/rules/path/governance.md`

- `codex-readme/rules/scenario/` 下的场景规则文件
- `codex-readme/rules/scenario/writing-language.md`

- `codex-readme/hooks/pre-task.md`
- `codex-readme/hooks/post-task-review.md`

- `codex-readme/agents/planner.md`
- `codex-readme/agents/collector.md`
- `codex-readme/agents/validator.md`
- `codex-readme/agents/reviewer.md`

- `codex-readme/memory/README.md`
- `codex-readme/memory/observations.jsonl`
- `codex-readme/memory/corrections.jsonl`
- `codex-readme/memory/learned-rules.jsonl`
- `codex-readme/memory/evolution-log.md`

如果当前仓库是多应用/多端/多服务结构，请为每个关键应用或子仓库设计相应的路径规则；必要时，为关键子目录生成子级 `AGENTS.md`，用于补充各自技术栈、关键目录和最小验证方式。

第三步：生成每个文件的内容
生成内容时，必须遵守以下原则：

A. 分层原则
- `project/` 负责项目级目标、约束、验收、架构摘要、任务路由、矩阵、模板。
- `rules/` 负责“按路径生效”和“按场景生效”的具体规则。
- `hooks/` 负责任务前置检查和任务后置复盘。
- `agents/` 负责执行角色分工，不要和 `rules/` 混写。
- `memory/` 负责长期经验、纠正、观察和演化日志。

B. 单一事实来源原则
- 不要把同一条规则复制到多个文件里作为多个事实来源。
- 如果某条内容是“全局目标”，放到 `project/`。
- 如果某条内容是“目录特有约束”，放到 `rules/path/`。
- 如果某条内容是“风险场景特有约束”，放到 `rules/scenario/`。
- 如果某条内容只是从任务中学到的经验，先进入 `memory/`，不要直接写死成规则，除非它已经足够稳定。

C. 自进化原则
必须显式设计“经验晋升链路”：
- 原始发现先写入 `observations.jsonl`
- 被证明错误的假设写入 `corrections.jsonl`
- 反复成立、可复用的经验写入 `learned-rules.jsonl`
- 长期稳定、适用范围明确的经验，再从 `memory/` 晋升到 `rules/`
- 治理结构本身变化时，更新 `memory/evolution-log.md`

D. 路由原则
`project/task-router.md` 必须能把“任务类型”映射到：
- 应加载哪些 `project/` 文档
- 应加载哪些路径规则
- 应加载哪些场景规则
- 应补看哪些矩阵
- 最低验证关注点是什么

E. 验证原则
`project/verification-matrix.md` 必须把“风险类型”映射到：
- 最低验证要求
- 至少一个失败路径要求
- 需要同步的文档/矩阵
- 回滚或止损记录要点

F. 契约原则
如果项目存在 API、事件、消息、共享 schema、SDK、数据库表结构、配置契约等共享边界，必须生成 `project/consumer-matrix.md`，显式列出：
- 生产者
- 已知消费者
- 变更后至少要同步检查什么
- 兼容性关注点

G. 任务模板原则
`project/task-execution-template.md` 至少统一为以下六段：
- 任务概览
- 上下文装载
- Plan
- Verify
- Review
- Memory

其中：
- `Plan` 写准备怎么做、会影响哪里、准备怎么验证
- `Verify` 只写实际做过的验证和明确缺口
- `Review` 优先写风险、回归点、一致性问题
- `Memory` 只写本次真正新增或修正的经验

H. Hook 原则
- `hooks/pre-task.md` 必须覆盖：装载上下文、任务分类、最小计划、风险识别、回滚思路。
- `hooks/post-task-review.md` 必须覆盖：验证结果、文档影响、记忆写入、规则晋升、语言复核。

I. 角色原则
- `planner`：把请求拆成可验证的小计划
- `collector`：收集最小必要上下文、定位文件、识别依赖和消费者
- `validator`：执行最小但有意义的验证，明确缺口
- `reviewer`：优先审查 bug、回归、一致性、发布准备度
角色职责要互补，不要相互重复。

J. 写作原则
- 治理文档默认使用 `<默认语言>`，但代码标识符、接口路径、配置键、字段字面值保持原样。
- 如果当前仓库已有稳定英文规范，可保持英文，但要一致。
- 文档要简洁、可执行，避免空泛口号。
- 不要写“根据实际情况填写”这类空模板，除非确实无法从仓库推断。

第四步：给出初始种子记忆
请基于当前仓库的真实结构，为 `memory/` 生成第一批 seed 条目：
- 至少 3 条 `observation`
- 至少 2 条 `correction`
- 至少 2 条 `learned-rule`

要求：
- 使用 JSON Lines
- 字段至少包含：
  - `date`
  - `type`
  - `scope`
  - `confidence`
  - `source`
  - `content`
  - `action`
  - `promote_to_rule`
- 初始种子可标记 `source: "governance-seed"`，但内容必须尽量贴近当前仓库的真实风险，而不是泛泛而谈。

第五步：生成根级 AGENTS.md
根级 `AGENTS.md` 必须明确：
- 作用范围
- 文档装载顺序
- 默认输出语言
- 何时需要补读 task-router / consumer-matrix / verification-matrix
- 如何选择路径规则和场景规则
- 任务开始前遵循哪个 Hook
- 任务结束前遵循哪个 Hook
- 何时应把经验写入 `memory/`
- 如果有多个应用/子仓库，分别如何路由到对应路径规则

第六步：质量自检
在最终输出前，请自查并修正以下问题：
- 是否把同一条规则写成了多个事实来源
- 是否只有规则，没有路由入口或验证矩阵
- 是否新增了规则却忘了同步 README / hooks / task-router / evolution-log
- 是否生成了与当前仓库无关的场景规则
- 是否遗漏高风险链路的快乐路径、失败路径、剩余风险、回滚思路
- 是否遗漏消费者矩阵或验证矩阵
- 是否让结构过重、过空、过度模板化

最终交付格式：
1. 先给出“仓库分析摘要”
2. 再给出“建议文件树”
3. 再给出“文件内容”
4. 再给出“为什么这些规则适配当前仓库”
5. 再给出“后续如何让这套结构持续自进化”

额外要求：
- 优先生成“最小可运行骨架”，不要一上来写成超大而空洞的治理百科。
- 如果仓库中已存在类似文档，优先做最小改造和归并，不要粗暴覆盖。
- 如果某些内容无法从仓库确认，请明确标注“假设”。
- 高风险任务默认要能落到：快乐路径、至少一个失败路径、剩余风险、回滚/止损思路。
- 如果治理结构有新增或调整，请同步给出 `memory/evolution-log.md` 的新增记录。
```
