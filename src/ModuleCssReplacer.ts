import type {AddonPluginHookPointEx} from "../../../dist-BeforeSC2/AddonPlugin";
import type {LifeTimeCircleHook, LogWrapper} from "../../../dist-BeforeSC2/ModLoadController";
import type {ModBootJsonAddonPlugin, ModInfo} from "../../../dist-BeforeSC2/ModLoader";
import type {ModZipReader} from "../../../dist-BeforeSC2/ModZipReader";
import type {SC2DataManager} from "../../../dist-BeforeSC2/SC2DataManager";
import type {ModUtils} from "../../../dist-BeforeSC2/Utils";
import {isNil} from "lodash";
import JSZip from "jszip";

interface ReplaceInfo {
    addonName: string;
    mod: ModInfo;
    modZip: ModZipReader;
}

export interface ReplaceParams {
    cssName: string;
    findString?: string;
    findRegex?: string;
    replace?: string;
    replaceFile?: string;
    debug?: boolean;
    // replace all , otherwise only first one
    all?: boolean;
}

export function checkParams(p: any): p is ReplaceParams {
    return p
        && typeof p === 'object'
        && typeof p.cssName === 'string'
        && (typeof p.findString === 'string' || typeof p.findRegex === 'string')
        && (typeof p.replace === 'string' || typeof p.replaceFile === 'string')
        && (isNil(p.debug) || typeof p.debug === 'boolean')
        ;
}

export class ModuleCssReplacer implements AddonPluginHookPointEx, LifeTimeCircleHook {
    private logger: LogWrapper;

    constructor(
        public gSC2DataManager: SC2DataManager,
        public gModUtils: ModUtils,
    ) {
        this.logger = gModUtils.getLogger();
        this.gSC2DataManager.getModLoadController().addLifeTimeCircleHook('ModuleCssReplacer', this);
    }

    test(k: string) {
        return async () => {
            console.warn('[ModuleCssReplacer]test:', k);
            this.logger.warn(`[ModuleCssReplacer]test:[${k}]`);
        };
    }

    // afterInit = this.test('afterInit');
    // afterInjectEarlyLoad = this.test('afterInjectEarlyLoad');
    // afterModLoad = this.test('afterModLoad');
    // afterEarlyLoad = this.test('afterEarlyLoad');
    // afterRegisterMod2Addon = this.test('afterRegisterMod2Addon');
    // beforePatchModToGame = this.test('beforePatchModToGame');
    // afterPatchModToGame = this.test('afterPatchModToGame');
    // afterPreload = this.test('afterPreload');
    // whenSC2PassageInit = this.test('whenSC2PassageInit');
    // whenSC2PassageStart = this.test('whenSC2PassageStart');
    // whenSC2PassageRender = this.test('whenSC2PassageRender');
    // whenSC2PassageDisplay = this.test('whenSC2PassageDisplay');
    // whenSC2PassageEnd = this.test('whenSC2PassageEnd');
    // whenSC2StoryReady = this.test('whenSC2StoryReady');

    info: Map<string, ReplaceInfo> = new Map<string, ReplaceInfo>();

    async registerMod(addonName: string, mod: ModInfo, modZip: ModZipReader) {
        this.info.set(mod.name, {
            addonName,
            mod,
            modZip,
        });
    }

    async afterPreload() {
        console.log('[ModuleCssReplacer] afterPreload start');
        this.logger.log('[ModuleCssReplacer] afterPreload start');
        const ns = this.getAllModuleStyleNode();
        for (const [name, ri] of this.info) {
            try {
                await this.do_patch(ri, ns);
            } catch (e: any | Error) {
                console.error(e);
                this.logger.error(`[ModuleCssReplacer]: ${name} ${e?.message ? e.message : e}`);
            }
        }
        console.log('[ModuleCssReplacer] afterPreload end');
        this.logger.log('[ModuleCssReplacer] afterPreload end');
    }

    getAllModuleStyleNode() {
        const w = this.gModUtils.getThisWindow();
        const styleNodes = Array.from(w.document.querySelectorAll('style'));
        const modulePart = styleNodes.filter(T => T.id.startsWith('style-module-'));
        return new Map<string, HTMLStyleElement>(modulePart.map(T => [
            T.id.replace('style-module-', ''),
            T,
        ]));
    }

    async exportDataZip(zip: JSZip): Promise<JSZip> {
        const nn = this.getAllModuleStyleNode();
        for (const n of nn) {
            zip.file(`ModuleCssReplacer/${n[0]}.css`, n[1].innerText);
        }
        return zip;
    }

    async do_patch(ri: ReplaceInfo, ns: Map<string, HTMLStyleElement>) {
        const ad = ri.mod.bootJson.addonPlugin?.find((T: ModBootJsonAddonPlugin) => {
            return T.modName === 'ModuleCssReplacer'
                && T.addonName === 'ModuleCssReplacerAddon';
        });
        if (!ad) {
            // never go there
            console.error('[ModuleCssReplacer] do_patch() (!ad).', [ri.mod]);
            return;
        }
        const params = ad.params;
        if (!params || !Array.isArray(params)) {
            console.error('[ModuleCssReplacer] do_patch() (!params).', [ri.mod]);
            this.logger.error(`[ModuleCssReplacer] do_patch() invalid params: ${ri.mod.name}`);
            return;
        }
        for (const p of params) {

            if (!checkParams(p)) {
                console.error('[ModuleCssReplacer] do_patch() (!this.checkParams(p)).', [ri.mod, p]);
                this.logger.error(`[ModuleCssReplacer] do_patch() invalid params p: [${ri.mod.name}] [${JSON.stringify(p)}]`);
                continue;
            }

            // falsy value will be false
            const debugFlag = !!p.debug;

            const replaceEvery = !!p.all;

            const pp = ns.get(p.cssName);
            if (!pp) {
                console.error('[ModuleCssReplacer] do_patch() (!pp).', [ri.mod, p]);
                this.logger.error(`[ModuleCssReplacer] do_patch() cannot find passage: [${ri.mod.name}] [${p.cssName}]`);
                continue;
            }
            let replaceString = p.replace;
            if (!replaceString) {
                const f = ri.modZip.zip.file(p.replaceFile!);
                const rf = await f?.async('string');
                if (!rf) {
                    console.error('[ModuleCssReplacer] do_patch() (!rf).', [ri.mod, p]);
                    this.logger.error(`[ModuleCssReplacer] do_patch() cannot find replaceFile: [${ri.mod.name}] [${p.replaceFile}]`);
                    continue;
                }
                replaceString = rf;
            }
            if (p.findString) {
                if (pp.innerText.indexOf(p.findString) < 0) {
                    console.error('[ModuleCssReplacer] do_patch() (pp.content.search(p.findString) < 0).', [ri.mod, p]);
                    this.logger.error(`[ModuleCssReplacer] do_patch() cannot find findString: [${ri.mod.name}] findString:[${p.findString}] in:[${p.cssName}]`);
                    continue;
                }
                if (debugFlag) {
                    console.log(`[ModuleCssReplacer] findString :`, p.findString);
                    console.log(`[ModuleCssReplacer] Before:`, pp.innerText);
                }
                if (replaceEvery) {
                    pp.innerText = pp.innerText.replaceAll(p.findString, replaceString);
                } else {
                    pp.innerText = pp.innerText.replace(p.findString, replaceString);
                }
                if (debugFlag) {
                    console.log(`[ModuleCssReplacer] After:`, pp.innerText);
                }
            } else if (p.findRegex) {
                if (pp.innerText.search(new RegExp(p.findRegex)) < 0) {
                    console.error('[ModuleCssReplacer] do_patch() (pp.content.search(p.findRegex) < 0).', [ri.mod, p]);
                    this.logger.error(`[ModuleCssReplacer] do_patch() cannot find findRegex: [${ri.mod.name}] findRegex:[${p.findRegex}] in:[${p.cssName}]`);
                    continue;
                }
                if (debugFlag) {
                    console.log(`[ModuleCssReplacer] findRegex :`, p.findRegex);
                    console.log(`[ModuleCssReplacer] Before:`, pp.innerText);
                }
                if (replaceEvery) {
                    pp.innerText = pp.innerText.replaceAll(new RegExp(p.findRegex), replaceString);
                } else {
                    pp.innerText = pp.innerText.replace(new RegExp(p.findRegex), replaceString);
                }
                if (debugFlag) {
                    console.log(`[ModuleCssReplacer] After:`, pp.innerText);
                }
            } else {
                console.error('[ModuleCssReplacer] do_patch() (!p.findString && !p.findRegex).', [ri.mod, p]);
                this.logger.error(`[ModuleCssReplacer] do_patch() invalid findString and findRegex: [${ri.mod.name}] [${p.findString}] [${p.findRegex}]`);
                continue;
            }
            console.log('[ModuleCssReplacer] do_patch() done.', [ri.mod, p]);
            this.logger.log(`[ModuleCssReplacer] do_patch() done: [${ri.mod.name}] [${p.cssName}] [${p.findString || ''}]/[${p.findRegex || ''}]`);
        }
    }

    init() {
        this.gModUtils.getAddonPluginManager().registerAddonPlugin(
            'ModuleCssReplacer',
            'ModuleCssReplacerAddon',
            this,
        );
    }
}
