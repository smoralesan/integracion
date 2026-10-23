export class HeroIntentSelector {
  constructor(){this.host=null;}
  dispose(){this.events?.abort();this.host=null;}
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
    this.host.dataset.heroMode=index===0?'sale':'buy';
    const input=this.host.querySelector('[data-hero-intent]');input.value=String(index);
    input.setAttribute('aria-valuetext',index===0?'Vendo terreno':'Compro terreno');
    this.host.querySelectorAll('[data-hero-content]').forEach((panel,i)=>{
      panel.classList.toggle('is-current',i===index);panel.setAttribute('aria-hidden',String(i!==index));panel.inert=i!==index;
    });
    this.host.querySelectorAll('[data-hero-entry]').forEach((link,i)=>link.classList.toggle('hero-reference-current',i===index));
  }
}
