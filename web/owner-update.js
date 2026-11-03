// A successful save may outlive its screen. Never replace another record or a newer revision.
export function applyOwnerRecordUpdate(state,record,hash){
 const path=String(hash||'').split('?')[0];
 if(!record?.id||path!=='#/mi-expediente/'+record.id||state.remoteRecord?.id!==record.id)return false;
 if(Number(record.revision??0)<Number(state.remoteRecord.revision??0))return false;
 state.remoteRecord=record;return true;
}
