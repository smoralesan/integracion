export class HeroIntentSelector {
  constructor(){this.host=null;this.index=null;}
  dispose(){this.events?.abort();this.motion?.cancel();this.motion=null;this.host=null;this.index=null;}
  mount(host){
    if(this.host===host)return;
    this.dispose();if(!host)return;
    this.host=host;this.events=new AbortController();
    host.addEventListener('input',event=>{
      if(event.target.matches('[data-hero-intent]'))this.show(Number(event.target.value));
    },{signal:this.events.signal});
    this.show(Number(host.querySelector('[data-hero-intent]').value));
  }
  show(index){
    if(!this.host||![0,1].includes(index))return;
    const indicator=this.host.querySelector('.hero-intent-indicator');
    const changed=this.index!==null&&this.index!==index;
    // Read the current visual position before cancelling, so a quick reversal stays fluid.
    const from=indicator?getComputedStyle(indicator).transform:'none';
    this.motion?.cancel();this.motion=null;
    this.host.dataset.heroMode=index===0?'sale':'buy';
    if(changed&&indicator?.animate&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      const travel=indicator.offsetWidth+4,target=index?travel:0,direction=index?1:-1;
      const startX=from==='none'?0:new DOMMatrixReadOnly(from).m41;
      const middle=startX+(target-startX)*.57;
      this.motion=indicator.animate([
        {transform:from,borderRadius:'22px',filter:'blur(0px)',offset:0},
        {transform:`translateX(${middle}px) scaleX(1.22) scaleY(.88)`,borderRadius:index?'24px 18px 24px 18px':'18px 24px 18px 24px',filter:'blur(.3px)',offset:.43},
        {transform:`translateX(${target+direction*3}px) scaleX(.96) scaleY(1.04)`,borderRadius:'23px',filter:'blur(0px)',offset:.78},
        {transform:`translateX(${target}px) scale(1)`,borderRadius:'22px',filter:'blur(0px)',offset:1}
      ],{duration:620,easing:'cubic-bezier(.22,.61,.36,1)'});
    }
    this.index=index;
    const input=this.host.querySelector('[data-hero-intent]');input.value=String(index);
    input.setAttribute('aria-valuetext',index===0?'Vendo terreno':'Compro terreno');
    this.host.querySelectorAll('[data-hero-content]').forEach((panel,i)=>{
      panel.classList.toggle('is-current',i===index);panel.setAttribute('aria-hidden',String(i!==index));panel.inert=i!==index;
    });
    this.host.querySelectorAll('[data-hero-entry]').forEach((link,i)=>link.classList.toggle('hero-reference-current',i===index));
  }
}
