import { test, expect } from '../framework';
import type { Page } from '@playwright/test';
import { setChineseLocale } from '../helpers/common';

type InteractionOption = {
  value?: unknown;
};

function optionHasMinionUid(option: InteractionOption, minionUid: string): boolean {
  const value = option.value;
  return !!value && typeof value === 'object' && (value as { minionUid?: unknown }).minionUid === minionUid;
}

function optionHasBaseIndex(option: InteractionOption, baseIndex: number): boolean {
  const value = option.value;
  return !!value && typeof value === 'object' && (value as { baseIndex?: unknown }).baseIndex === baseIndex;
}

async function assertRussianFactionDetailLoaded(page: Page): Promise<void> {
  const detail = page.getByTestId('faction-detail-panel');
  await expect(detail).toBeVisible({ timeout: 10000 });
  await expect(detail.getByRole('heading', { name: '俄罗斯童话' })).toBeVisible();
  await expect(detail.getByRole('tab', { name: /手牌\s*·\s*16/ })).toBeVisible();

  for (const cardName of ['芬尼斯特猎鹰', '芭芭雅嘎', '青蛙公主', '变化', '弥撒变化']) {
    await expect(detail.getByText(cardName).first()).toBeVisible();
  }
}

async function assertCardVisualReady(page: Page, cardUid: string): Promise<void> {
  const card = page.locator(`[data-card-uid="${cardUid}"], [data-minion-uid="${cardUid}"]`).first();
  await expect(card).toBeVisible({ timeout: 10000 });
  await expect.poll(async () => card.evaluate((element) => {
    const hasShimmer = element.querySelector('.atlas-shimmer') !== null;
    const hasImage = element.querySelector('img') !== null;
    const hasBackground = Array.from(element.querySelectorAll<HTMLElement>('div')).some((node) => (
      window.getComputedStyle(node).backgroundImage.includes('url(')
    ));
    return { hasShimmer, hasVisual: hasImage || hasBackground };
  }), { timeout: 15000 }).toEqual({ hasShimmer: false, hasVisual: true });
}

async function dismissSpotlightIfPresent(page: Page): Promise<void> {
  const spotlightQueue = page.getByTestId('card-spotlight-queue');
  if (await spotlightQueue.isVisible({ timeout: 300 }).catch(() => false)) {
    await spotlightQueue.getByRole('button', { name: /^(关闭特写|Close spotlight)$/i }).click({ force: true });
    await page.waitForTimeout(200);
  }

  const dismissHint = page.getByText(/Click anywhere to close|点击关闭|点击任意位置关闭/i).first();
  if (await dismissHint.isVisible({ timeout: 300 }).catch(() => false)) {
    await dismissHint.click({ force: true });
    await page.waitForTimeout(200);
  }
}

async function dismissCardMagnifyIfPresent(page: Page): Promise<void> {
  const overlay = page.getByTestId('su-card-magnify-overlay');
  if (!(await overlay.isVisible({ timeout: 300 }).catch(() => false))) return;
  await overlay.getByRole('button', { name: 'X' }).click({ force: true });
  await expect(overlay).toBeHidden({ timeout: 5000 });
}

test.describe('大杀四方文化冲击俄罗斯童话真实入口验证', () => {
  test('派系选择页能看到俄罗斯童话，并加载文化冲击图集', async ({ page, game }, testInfo) => {
    test.setTimeout(90000);
    await setChineseLocale(page.context());
    await game.openTestGame('smashup', { skipInitialization: true }, 45000);
    await game.setupScene({
      gameId: 'smashup',
      currentPlayer: '0',
      phase: 'factionSelect',
      extra: {
        core: {
          turnOrder: ['0', '1'],
          currentPlayerIndex: 0,
          turnNumber: 1,
          nextUid: 1000,
          players: {
            '0': { id: '0', vp: 0, hand: [], deck: [], discard: [], factions: ['aliens', 'pirates'], minionsPlayed: 0, minionLimit: 1, actionsPlayed: 0, actionLimit: 1 },
            '1': { id: '1', vp: 0, hand: [], deck: [], discard: [], factions: ['ninjas', 'robots'], minionsPlayed: 0, minionLimit: 1, actionsPlayed: 0, actionLimit: 1 },
          },
          factionSelection: {
            takenFactions: [],
            playerSelections: { '0': [], '1': [] },
            completedPlayers: [],
          },
        },
      },
    });

    const factionSearch = page.getByTestId('faction-search-input');
    await expect(factionSearch).toBeVisible({ timeout: 15000 });
    await factionSearch.fill('俄罗斯');

    const option = page.getByTestId('faction-option-russian_fairy_tales');
    await expect(option).toBeVisible({ timeout: 15000 });
    await expect.poll(async () => option.locator('.atlas-shimmer').count(), {
      message: '俄罗斯童话派系卡不应残留 atlas shimmer',
      timeout: 15000,
    }).toBe(0);
    await option.click();
    await assertRussianFactionDetailLoaded(page);
    await game.screenshot('01-俄罗斯童话-派系选择页图集可见', testInfo);
  });

  test('变化可从真实打牌入口将场上随从变形成牌库随从', async ({ page, game }, testInfo) => {
    test.setTimeout(120000);
    await setChineseLocale(page.context());
    await game.openTestGame('smashup', {
      p0: 'russian_fairy_tales,aliens',
      p1: 'pirates,ninjas',
      skipFactionSelect: true,
      skipInitialization: false,
      seed: 20260714,
    }, 45000);

    await game.setupScene({
      gameId: 'smashup',
      currentPlayer: '0',
      phase: 'playCards',
      player0: {
        hand: [
          { uid: 'transformation', defId: 'russian_fairy_tales_transformation', type: 'action', owner: '0' },
        ],
        deck: [
          { uid: 'deck-action', defId: 'russian_fairy_tales_the_water_of_life', type: 'action', owner: '0' },
          { uid: 'deck-minion', defId: 'russian_fairy_tales_the_birch', type: 'minion', owner: '0' },
        ],
        discard: [],
        factions: ['russian_fairy_tales', 'aliens'],
        minionsPlayed: 0,
        minionLimit: 1,
        actionsPlayed: 0,
        actionLimit: 3,
        vp: 0,
      },
      player1: {
        hand: [],
        deck: [],
        discard: [],
        factions: ['pirates', 'ninjas'],
        minionsPlayed: 0,
        minionLimit: 1,
        actionsPlayed: 0,
        actionLimit: 1,
        vp: 0,
      },
      bases: [
        {
          defId: 'base_transformation_spring',
          minions: [
            { uid: 'target-minion', defId: 'pirate_first_mate', owner: '0', controller: '0', power: 2 },
          ],
        },
        { defId: 'base_giant_turnip', minions: [] },
      ],
    });

    await game.waitForPhase('playCards');
    await assertCardVisualReady(page, 'transformation');
    await assertCardVisualReady(page, 'target-minion');
    await game.screenshot('02-变化-触发前', testInfo);

    await game.playCard('russian_fairy_tales_transformation');
    await game.waitForInteraction('russian_fairy_tales_transformation', 10000);
    await game.screenshot('03-变化-选择要变形的随从', testInfo);
    await game.selectInteractionOptionBy(
      option => optionHasMinionUid(option, 'target-minion'),
      '变化选择场上的目标随从',
    );
    await game.waitForNoInteraction(10000);
    await dismissSpotlightIfPresent(page);

    await expect.poll(async () => {
      const state = await game.getState();
      return {
        base0Minions: state.core.bases[0]?.minions?.map((minion: { uid?: string }) => minion.uid) ?? [],
        deckUids: state.core.players['0']?.deck?.map((card: { uid?: string }) => card.uid) ?? [],
        discardUids: state.core.players['0']?.discard?.map((card: { uid?: string }) => card.uid) ?? [],
        interactionOpen: Boolean(state.sys?.interaction?.current),
      };
    }, { timeout: 10000 }).toEqual({
      base0Minions: ['deck-minion'],
      deckUids: ['deck-action', 'target-minion'],
      discardUids: ['transformation'],
      interactionOpen: false,
    });
    await assertCardVisualReady(page, 'deck-minion');
    await game.screenshot('04-变化-白桦木变形结算后', testInfo);
  });

  test('弥撒变化在真实入口下按真实拥有者归还借来牌并让双方按原手牌数抽回', async ({ page, game }, testInfo) => {
    test.setTimeout(120000);
    await setChineseLocale(page.context());
    await game.openTestGame('smashup', {
      p0: 'russian_fairy_tales,aliens',
      p1: 'pirates,ninjas',
      skipFactionSelect: true,
      skipInitialization: false,
      seed: 20260919,
    }, 45000);

    await game.setupScene({
      gameId: 'smashup',
      currentPlayer: '0',
      phase: 'playCards',
      player0: {
        hand: [
          { uid: 'mass-transformation', defId: 'russian_fairy_tales_mass_transformation', type: 'action', owner: '0' },
          { uid: 'borrowed-hand', defId: 'russian_fairy_tales_toad', type: 'minion', owner: '1', controller: '0' },
          { uid: 'p0-hand-b', defId: 'russian_fairy_tales_baba_yaga', type: 'minion', owner: '0', controller: '0' },
        ],
        deck: [
          { uid: 'p0-deck-a', defId: 'russian_fairy_tales_the_water_of_life', type: 'action', owner: '0' },
          { uid: 'p0-deck-b', defId: 'russian_fairy_tales_transformation', type: 'action', owner: '0' },
        ],
        discard: [],
        factions: ['russian_fairy_tales', 'aliens'],
        minionsPlayed: 0,
        minionLimit: 1,
        actionsPlayed: 0,
        actionLimit: 3,
        vp: 0,
      },
      player1: {
        hand: [
          { uid: 'p1-hand', defId: 'pirate_first_mate', type: 'minion', owner: '1', controller: '1' },
        ],
        deck: [
          { uid: 'p1-deck-a', defId: 'pirate_full_sail', type: 'action', owner: '1' },
          { uid: 'p1-deck-b', defId: 'ninja_shinobi', type: 'minion', owner: '1', controller: '1' },
        ],
        discard: [],
        factions: ['pirates', 'ninjas'],
        minionsPlayed: 0,
        minionLimit: 1,
        actionsPlayed: 0,
        actionLimit: 1,
        vp: 0,
      },
      bases: [
        { defId: 'base_giant_turnip', minions: [] },
        { defId: 'base_transformation_spring', minions: [] },
      ],
    });

    await game.waitForPhase('playCards');
    await assertCardVisualReady(page, 'mass-transformation');
    await assertCardVisualReady(page, 'borrowed-hand');
    await game.screenshot('05-弥撒变化-借来手牌触发前', testInfo);

    await game.playCard('russian_fairy_tales_mass_transformation');
    await game.waitForNoInteraction(10000);

    await expect.poll(async () => {
      const state = await game.getState();
      return {
        p0Hand: state.core.players['0']?.hand?.map((card: { uid?: string }) => card.uid) ?? [],
        p0Deck: state.core.players['0']?.deck?.map((card: { uid?: string }) => card.uid) ?? [],
        p0Discard: state.core.players['0']?.discard?.map((card: { uid?: string }) => card.uid) ?? [],
        p1Hand: state.core.players['1']?.hand?.map((card: { uid?: string }) => card.uid) ?? [],
        p1Deck: state.core.players['1']?.deck?.map((card: { uid?: string }) => card.uid) ?? [],
        p1Discard: state.core.players['1']?.discard?.map((card: { uid?: string }) => card.uid) ?? [],
        interactionOpen: Boolean(state.sys?.interaction?.current),
      };
    }, { timeout: 15000 }).toEqual({
      p0Hand: ['p0-deck-a', 'p0-deck-b'],
      p0Deck: ['p0-hand-b'],
      p0Discard: ['mass-transformation'],
      p1Hand: ['p1-deck-a'],
      p1Deck: ['p1-deck-b', 'borrowed-hand', 'p1-hand'],
      p1Discard: [],
      interactionOpen: false,
    });
    await game.screenshot('06-弥撒变化-借来牌归还真实拥有者并抽回', testInfo);
  });

  test('芬尼斯特猎鹰被借来控制时，真实计分前特殊入口仍回到控制者手牌并额外打出', async ({ page, game }, testInfo) => {
    test.setTimeout(120000);
    await setChineseLocale(page.context());
    await game.openTestGame('smashup', {
      p0: 'russian_fairy_tales,aliens',
      p1: 'pirates,ninjas',
      skipFactionSelect: true,
      skipInitialization: false,
      seed: 20260919,
    }, 45000);

    await game.setupScene({
      gameId: 'smashup',
      currentPlayer: '0',
      phase: 'scoreBases',
      extra: {
        core: {
          scoringEligibleBaseIndices: [0],
        },
      },
      player0: {
        hand: [],
        deck: [],
        discard: [],
        factions: ['russian_fairy_tales', 'aliens'],
        minionsPlayed: 0,
        minionLimit: 1,
        actionsPlayed: 0,
        actionLimit: 1,
        vp: 0,
      },
      player1: {
        hand: [],
        deck: [],
        discard: [],
        factions: ['pirates', 'ninjas'],
        minionsPlayed: 0,
        minionLimit: 1,
        actionsPlayed: 0,
        actionLimit: 1,
        vp: 0,
      },
      bases: [
        {
          defId: 'base_transformation_spring',
          minions: [
            { uid: 'borrowed-finist', defId: 'russian_fairy_tales_finist_the_falcon', owner: '1', controller: '0', power: 4 },
          ],
        },
        { defId: 'base_giant_turnip', minions: [] },
      ],
    });

    await game.waitForPhase('scoreBases');
    await assertCardVisualReady(page, 'borrowed-finist');
    await game.screenshot('07-芬尼斯特-借控计分前触发', testInfo);

    await page.locator('[data-minion-uid="borrowed-finist"]').click();
    await game.waitForInteraction('russian_fairy_tales_finist_the_falcon', 10000);
    await game.screenshot('08-芬尼斯特-借控选择额外打出基地', testInfo);
    await game.selectInteractionOptionBy(
      option => optionHasBaseIndex(option, 1),
      '芬尼斯特选择第二基地',
    );
    await game.waitForNoInteraction(10000);

    await expect.poll(async () => {
      const state = await game.getState();
      return {
        base0Minions: state.core.bases[0]?.minions?.map((minion: { uid?: string }) => minion.uid) ?? [],
        base1Minions: state.core.bases[1]?.minions?.map((minion: { uid?: string; controller?: string; owner?: string }) => ({
          uid: minion.uid,
          controller: minion.controller,
          owner: minion.owner,
        })) ?? [],
        p0Hand: state.core.players['0']?.hand?.map((card: { uid?: string }) => card.uid) ?? [],
        p1Hand: state.core.players['1']?.hand?.map((card: { uid?: string }) => card.uid) ?? [],
        interactionOpen: Boolean(state.sys?.interaction?.current),
      };
    }, { timeout: 15000 }).toEqual({
      base0Minions: [],
      base1Minions: [{ uid: 'borrowed-finist', controller: '0', owner: '1' }],
      p0Hand: [],
      p1Hand: [],
      interactionOpen: false,
    });
    await game.screenshot('09-芬尼斯特-借控回手后额外打出并收口', testInfo);
  });

  test('青蛙公主在借来控制的宿主上真实触发后按 owner/controller 语义转移', async ({ page, game }, testInfo) => {
    test.setTimeout(120000);
    await setChineseLocale(page.context());
    await game.openTestGame('smashup', {
      p0: 'russian_fairy_tales,aliens',
      p1: 'pirates,ninjas',
      skipFactionSelect: true,
      skipInitialization: false,
      seed: 20260919,
    }, 45000);

    await game.setupScene({
      gameId: 'smashup',
      currentPlayer: '0',
      phase: 'playCards',
      player0: {
        hand: [
          { uid: 'frog-action', defId: 'russian_fairy_tales_the_frog_princess', type: 'action', owner: '0' },
        ],
        deck: [
          { uid: 'deck-action', defId: 'russian_fairy_tales_the_water_of_life', type: 'action', owner: '0' },
          { uid: 'deck-minion', defId: 'russian_fairy_tales_the_birch', type: 'minion', owner: '0' },
        ],
        discard: [],
        factions: ['russian_fairy_tales', 'aliens'],
        minionsPlayed: 0,
        minionLimit: 1,
        actionsPlayed: 0,
        actionLimit: 3,
        vp: 0,
      },
      player1: {
        hand: [],
        deck: [
          { uid: 'p1-deck', defId: 'pirate_first_mate', type: 'minion', owner: '1' },
        ],
        discard: [],
        factions: ['pirates', 'ninjas'],
        minionsPlayed: 0,
        minionLimit: 1,
        actionsPlayed: 0,
        actionLimit: 1,
        vp: 0,
      },
      bases: [
        {
          defId: 'base_transformation_spring',
          minions: [
            { uid: 'borrowed-host', defId: 'pirate_first_mate', owner: '1', controller: '0', power: 2 },
          ],
        },
        { defId: 'base_giant_turnip', minions: [] },
      ],
    });

    await game.waitForPhase('playCards');
    await assertCardVisualReady(page, 'frog-action');
    await assertCardVisualReady(page, 'borrowed-host');
    await game.screenshot('10-青蛙公主-借来宿主附着前', testInfo);

    await game.playCard('russian_fairy_tales_the_frog_princess', {
      targetBaseIndex: 0,
      targetMinionUid: 'borrowed-host',
    });
    await game.waitForNoInteraction(10000);
    const borrowedHost = page.locator('[data-minion-uid="borrowed-host"]');
    await page.mouse.move(0, 0);
    await borrowedHost.hover();
    await expect(borrowedHost).toHaveAttribute('data-attached-overlay-visible', 'true', { timeout: 10000 });
    await expect(page.locator('[data-attached-action-uid="frog-action"]')).toBeVisible({ timeout: 10000 });
    await game.screenshot('11-青蛙公主-借来宿主附着后', testInfo);

    await page.locator('[data-attached-action-uid="frog-action"]').click({ force: true });
    await game.waitForNoInteraction(10000);
    await dismissSpotlightIfPresent(page);

    await expect.poll(async () => {
      const state = await game.getState();
      const minion = state.core.bases[0]?.minions.find((candidate: { uid?: string }) => candidate.uid === 'deck-minion');
      return {
        base0Minions: state.core.bases[0]?.minions?.map((candidate: { uid?: string }) => candidate.uid) ?? [],
        frogOnReplacement: minion?.attachedActions?.some((action: { uid?: string; talentUsed?: boolean }) => (
          action.uid === 'frog-action' && action.talentUsed === true
        )) ?? false,
        p0Deck: state.core.players['0']?.deck?.map((card: { uid?: string }) => card.uid) ?? [],
        p1Deck: state.core.players['1']?.deck?.map((card: { uid?: string }) => card.uid) ?? [],
        interactionOpen: Boolean(state.sys?.interaction?.current),
      };
    }, { timeout: 15000 }).toEqual({
      base0Minions: ['deck-minion'],
      frogOnReplacement: true,
      p0Deck: ['deck-action'],
      p1Deck: ['p1-deck', 'borrowed-host'],
      interactionOpen: false,
    });
    await game.screenshot('12-青蛙公主-宿主回拥有者牌库并转移行动后', testInfo);
  });

  test('着魔从真实附着入口在宿主离场后转移到另一个随从', async ({ page, game }, testInfo) => {
    test.setTimeout(120000);
    await setChineseLocale(page.context());
    await game.openTestGame('smashup', {
      p0: 'russian_fairy_tales,ninjas',
      p1: 'pirates,dinosaurs',
      skipFactionSelect: true,
      skipInitialization: false,
      seed: 20260919,
    }, 45000);

    await game.setupScene({
      gameId: 'smashup',
      currentPlayer: '0',
      phase: 'playCards',
      player0: {
        hand: [
          { uid: 'bewitched-card', defId: 'russian_fairy_tales_bewitched', type: 'action', owner: '0' },
          { uid: 'assassination-card', defId: 'ninja_assassination', type: 'action', owner: '0' },
        ],
        deck: [],
        discard: [],
        factions: ['russian_fairy_tales', 'ninjas'],
        minionsPlayed: 0,
        minionLimit: 1,
        actionsPlayed: 0,
        actionLimit: 2,
        vp: 0,
      },
      player1: {
        hand: [],
        deck: [],
        discard: [],
        factions: ['pirates', 'dinosaurs'],
        minionsPlayed: 0,
        minionLimit: 1,
        actionsPlayed: 0,
        actionLimit: 1,
        vp: 0,
      },
      bases: [
        {
          defId: 'base_transformation_spring',
          minions: [
            { uid: 'bewitched-host', defId: 'pirate_first_mate', owner: '1', controller: '1', power: 2 },
          ],
        },
        {
          defId: 'base_giant_turnip',
          minions: [
            { uid: 'bewitched-target', defId: 'pirate_buccaneer', owner: '0', controller: '0', power: 3 },
          ],
        },
      ],
    });

    await game.waitForPhase('playCards');
    await assertCardVisualReady(page, 'bewitched-card');
    await assertCardVisualReady(page, 'bewitched-host');
    await game.screenshot('13-着魔-真实附着入口触发前', testInfo);

    await game.playCard('russian_fairy_tales_bewitched', { targetBaseIndex: 0, targetMinionUid: 'bewitched-host' });
    await game.waitForNoInteraction(10000);
    await dismissSpotlightIfPresent(page);

    const afterAttach = await game.getState();
    const hostAfterAttach = afterAttach.core.bases[0]?.minions?.find((minion: { uid?: string }) => minion.uid === 'bewitched-host');
    const attachedBewitchedUid = hostAfterAttach?.attachedActions?.find((action: { defId?: string; uid?: string }) => (
      action.defId === 'russian_fairy_tales_bewitched'
    ))?.uid;
    expect(attachedBewitchedUid).toBeTruthy();
    expect(hostAfterAttach?.attachedActions?.map((action: { defId?: string }) => action.defId)).toEqual([
      'russian_fairy_tales_bewitched',
    ]);
    await page.locator('[data-minion-uid="bewitched-host"]').click({ force: true });
    await expect(page.locator(`[data-attached-action-uid="${attachedBewitchedUid}"]`)).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('su-minion-power-badge-bewitched-host')).toContainText('+2');
    await game.screenshot('14-着魔-宿主附着并获得加力', testInfo);
    await dismissCardMagnifyIfPresent(page);

    await game.playCard('ninja_assassination', { targetBaseIndex: 0, targetMinionUid: 'bewitched-host' });
    await game.waitForNoInteraction(10000);
    await dismissSpotlightIfPresent(page);
    await page.getByRole('button', { name: /^(结束回合|Finish Turn|End)$/i }).click({ force: true });
    await game.waitForInteraction('russian_fairy_tales_bewitched_transfer', 15000);
    await game.screenshot('15-着魔-宿主离场后的转移选择', testInfo);

    const transferOptions = await game.getInteractionOptions();
    expect(transferOptions.some((option: any) => option.value?.minionUid === 'bewitched-target' && option.value?.baseIndex === 1)).toBe(true);
    await game.selectInteractionOptionBy(
      option => option.value?.minionUid === 'bewitched-target',
      '着魔转移到第二基地的随从',
    );
    await game.waitForNoInteraction(10000);

    const finalState = await game.getState();
    const hostStillExists = finalState.core.bases.some((base: any) => base.minions?.some((minion: any) => minion.uid === 'bewitched-host'));
    const transferredTarget = finalState.core.bases[1]?.minions?.find((minion: { uid?: string }) => minion.uid === 'bewitched-target');
    const transferredAction = transferredTarget?.attachedActions?.find((action: { defId?: string; uid?: string }) => (
      action.defId === 'russian_fairy_tales_bewitched'
    ));
    expect(hostStillExists).toBe(false);
    expect(transferredAction?.uid).toBe(attachedBewitchedUid);
    expect(finalState.core.players['0']?.discard?.some((card: { defId?: string }) => card.defId === 'russian_fairy_tales_bewitched')).toBe(false);
    expect(finalState.sys?.interaction?.current).toBeFalsy();

    await page.locator('[data-minion-uid="bewitched-target"]').click({ force: true });
    await expect(page.locator(`[data-attached-action-uid="${attachedBewitchedUid}"]`)).toBeVisible({ timeout: 10000 });
    await game.screenshot('16-着魔-附着行动转移并收口', testInfo);
  });
});
