/**
 * 目标解析框架
 *
 * 提供内置目标类型（self/opponent/all）和游戏注册的自定义解析器。
 * 取代各游戏独立实现的 resolveTargetUnits / TargetRef 解析逻辑。
 *
 * 设计原则：
 * - 引擎层只定义"目标引用"的结构和解析框架
 * - 具体的目标类型语义由游戏层注册（如 adjacentEnemies、inRange 等）
 */

// ============================================================================
// 目标类型定义
// ============================================================================

/**
 * 目标类型（用于 UI 渲染和交互提示）
 * 
 * - 'minion': 场上的随从
 * - 'action': 行动卡（手牌或场上的 ongoing）
 * - 'card': 任意卡牌（随从、行动或泰坦）
 * - 'base': 基地
 * - 'player': 玩家
 */
export type TargetType = 
  | 'minion'
  | 'action'
  | 'card'
  | 'base'
  | 'player';

/**
 * 卡牌目标（用于选择任意类型的卡牌）
 * 
 * 适用场景：
 * - 选择泰坦卡（从泰坦区域或场上）
 * - 选择任意卡牌（不限类型）
 * - 需要区分卡牌类型的效果
 */
export interface CardTarget {
  /** 目标类型标识 */
  type: 'card';
  /** 卡牌 UID */
  cardUid: string;
  /** 卡牌类型 */
  cardType: 'minion' | 'action' | 'titan';
  /** 所属玩家 */
  playerId: string;
  /** 卡牌位置 */
  location: 'field' | 'hand' | 'discard' | 'ongoing' | 'titan';
}

// ============================================================================
// 类型定义
// ============================================================================

/** 内置目标引用 */
export interface BuiltinTargetRef {
  type: 'self' | 'opponent' | 'all';
}

/** 按 ID 引用 */
export interface IdTargetRef {
  type: 'id';
  id: string;
}

/** 自定义目标引用（通过注册的解析器处理） */
export interface CustomTargetRef {
  type: 'custom';
  resolver: string;
  params?: Record<string, unknown>;
}

/** 目标引用联合类型 */
export type TargetRef = BuiltinTargetRef | IdTargetRef | CustomTargetRef;

/**
 * 解析上下文（游戏层传入，引擎层不关心具体内容）
 *
 * 至少包含 sourceId（技能/效果发起者）
 */
export interface TargetContext {
  sourceId: string;
  [key: string]: unknown;
}

// ============================================================================
// 自定义解析器注册
// ============================================================================

/**
 * 自定义目标解析器函数类型
 *
 * @param params 目标引用中的 params
 * @param ctx    解析上下文
 * @returns      目标 ID 列表
 */
export type TargetResolver = (
  params: Record<string, unknown> | undefined,
  ctx: TargetContext,
) => string[];

/**
 * 目标解析器注册表
 */
export interface TargetResolverRegistry {
  resolvers: Map<string, TargetResolver>;
}

/** 创建空的目标解析器注册表 */
export function createTargetResolverRegistry(): TargetResolverRegistry {
  return { resolvers: new Map() };
}

/** 注册自定义目标解析器 */
export function registerTargetResolver(
  registry: TargetResolverRegistry,
  name: string,
  resolver: TargetResolver,
): void {
  registry.resolvers.set(name, resolver);
}

// ============================================================================
// 目标解析
// ============================================================================

/**
 * 解析目标引用，返回目标 ID 列表
 *
 * @param ref      目标引用
 * @param ctx      解析上下文
 * @param registry 自定义解析器注册表（CustomTargetRef 需要）
 * @returns        目标 ID 列表
 */
export function resolveTarget(
  ref: TargetRef,
  ctx: TargetContext,
  registry?: TargetResolverRegistry,
): string[] {
  switch (ref.type) {
    case 'self':
      return [ctx.sourceId];

    case 'opponent': {
      const opponentId = ctx.opponentId;
      return typeof opponentId === 'string' ? [opponentId] : [];
    }

    case 'all': {
      const allIds = ctx.allIds;
      return Array.isArray(allIds) ? allIds as string[] : [];
    }

    case 'id':
      return [ref.id];

    case 'custom': {
      if (!registry) {
        throw new Error(`自定义目标 '${ref.resolver}' 需要提供 TargetResolverRegistry`);
      }
      const resolver = registry.resolvers.get(ref.resolver);
      if (!resolver) {
        throw new Error(`未注册的目标解析器: ${ref.resolver}`);
      }
      return resolver(ref.params, ctx);
    }
  }
}
