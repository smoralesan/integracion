export function movePublicationStep(state,target,save){const previous=state.formStep;state.formStep=target;if(!save()){state.formStep=previous;return false;}return true;}
export function photoSaveMessage(saved,messages=[],count=0){if(!saved)return 'No se pudo guardar el borrador. Las fotos no se agregaron.';return messages.join(' ')||(count?'Fotos guardadas solo en este navegador.':'No se agregaron fotos.');}
export function setUploadMessage(root,message){const output=root?.querySelector('#file-message');if(output)output.textContent=message;return !!output;}

export function startPublicationUpload(state){if(state.uploadingFiles||state.submitting)return false;state.uploadingFiles=true;return true;}
export function finishPublicationUpload(state){state.uploadingFiles=false;}
