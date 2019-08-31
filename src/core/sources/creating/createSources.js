import { AutomaticTypeDetector } from "../types/AutomaticTypeDetector";
import { CreatingSourcesLocalStorageManager } from "./CreatingSourcesLocalStorageManager";
import { DetectedTypeActioner } from "../types/DetectedTypeActioner";

export function createSources(
    {
        data: { sources },
        props: { types: typesProp, type: typeProp, },
        injector: { resolve }
    }
) {
    const detectedTypeActioner = resolve(DetectedTypeActioner);
    const localStorageManager = resolve(CreatingSourcesLocalStorageManager);
    let sourceTypeRetrievedWithoutXhr;
    let sourceIndex;

    for (let i = 0; i < sources.length; i++) {
        sourceIndex = i;

        let typeSetManuallyByClient;
        if (typesProp && typesProp[i]) {
            typeSetManuallyByClient = typesProp[i];
        } else if (typeProp) {
            typeSetManuallyByClient = typeProp;
        }

        // if client set type it's always the most important one
        if (typeSetManuallyByClient) {
            sourceTypeRetrievedWithoutXhr = typeSetManuallyByClient;
            callActionsForSourceTypeRetrievedWithoutXhr();
            continue;
        }

        sourceTypeRetrievedWithoutXhr = localStorageManager.getSourceTypeFromLocalStorageByUrl(sources[i]);
        (sourceTypeRetrievedWithoutXhr) ?
            callActionsForSourceTypeRetrievedWithoutXhr() :
            retrieveTypeWithXhrAndCallActions();
    }

    function callActionsForSourceTypeRetrievedWithoutXhr() {
        detectedTypeActioner.runActionsForSourceTypeAndIndex(
            sourceTypeRetrievedWithoutXhr, sourceIndex
        );
    }

    function retrieveTypeWithXhrAndCallActions() {
        // we need to copy index because xhr will for sure come later than next loop iteration
        let rememberedSourceIndex = sourceIndex;
        const sourceTypeGetter = resolve(AutomaticTypeDetector);
        sourceTypeGetter.setUrlToCheck(sources[rememberedSourceIndex]);
        sourceTypeGetter.getSourceType((sourceType) => {
            localStorageManager.handleReceivedSourceTypeForUrl(sourceType, sources[rememberedSourceIndex]);
            detectedTypeActioner.runActionsForSourceTypeAndIndex(sourceType, rememberedSourceIndex)
        });
    }
}
