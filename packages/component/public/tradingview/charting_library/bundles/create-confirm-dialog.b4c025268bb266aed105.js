(self.webpackChunktradingview=self.webpackChunktradingview||[]).push([[3566],{58644:e=>{e.exports={wrapper:"wrapper-2eXD4rIf",input:"input-2eXD4rIf",box:"box-2eXD4rIf",icon:"icon-2eXD4rIf",noOutline:"noOutline-2eXD4rIf","intent-danger":"intent-danger-2eXD4rIf",check:"check-2eXD4rIf",dot:"dot-2eXD4rIf"}},28209:e=>{e.exports={checkbox:"checkbox-2jiVkfto",reverse:"reverse-2jiVkfto",label:"label-2jiVkfto",baseline:"baseline-2jiVkfto"}},83254:e=>{e.exports={"tablet-small-breakpoint":"screen and (max-width: 428px)",dialog:"dialog-1Bm1Tr0A",message:"message-1Bm1Tr0A",messageWithCheckbox:"messageWithCheckbox-1Bm1Tr0A",checkbox:"checkbox-1Bm1Tr0A",messageBlock:"messageBlock-1Bm1Tr0A"}},57810:e=>{e.exports={text:"text-3Wd1RGGX",checkbox:"checkbox-3Wd1RGGX"}},66183:e=>{e.exports={icon:"icon-NnWruywv"}},37604:(e,t,n)=>{"use strict";n.d(t,{CheckboxInput:()=>l});var s=n(67294),o=n(94184),a=n(21659),i=n(7536),r=n(58644),c=n.n(r);function l(e){const t=o(c().box,c()["intent-"+e.intent],{[c().check]:!Boolean(e.indeterminate),[c().dot]:Boolean(e.indeterminate),[c().noOutline]:-1===e.tabIndex}),n=o(c().wrapper,e.className);return s.createElement("span",{className:n,title:e.title},s.createElement("input",{id:e.id,tabIndex:e.tabIndex,className:c().input,type:"checkbox",name:e.name,checked:e.checked,disabled:e.disabled,value:e.value,autoFocus:e.autoFocus,role:e.role,onChange:function(){e.onChange&&e.onChange(e.value)},ref:e.reference}),s.createElement("span",{className:t},s.createElement(a.Icon,{icon:i,className:c().icon})))}},18270:(e,t,n)=>{"use strict";n.d(t,{Checkbox:()=>l});var s=n(67294),o=n(94184),a=n(60624),i=n(37604),r=n(28209),c=n.n(r);class l extends s.PureComponent{render(){const{inputClassName:e,labelClassName:t,...n}=this.props,a=o(this.props.className,c().checkbox,{[c().reverse]:Boolean(this.props.labelPositionReverse),[c().baseline]:Boolean(this.props.labelAlignBaseline)}),r=o(c().label,t,{[c().disabled]:this.props.disabled});let l=null;return this.props.label&&(l=s.createElement("span",{className:r,title:this.props.title},this.props.label)),s.createElement("label",{className:a},s.createElement(i.CheckboxInput,{...n,className:e}),l)}}l.defaultProps={value:"on"};(0,a.makeSwitchGroupItem)(l)},60624:(e,t,n)=>{"use strict";n.d(t,{SwitchGroup:()=>a,makeSwitchGroupItem:()=>i});var s=n(67294),o=n(45697);class a extends s.PureComponent{constructor(){super(...arguments),this._subscriptions=new Set,this._getName=()=>this.props.name,this._getValues=()=>this.props.values,this._getOnChange=()=>this.props.onChange,this._subscribe=e=>{this._subscriptions.add(e)},this._unsubscribe=e=>{this._subscriptions.delete(e)}}getChildContext(){return{switchGroupContext:{getName:this._getName,getValues:this._getValues,getOnChange:this._getOnChange,subscribe:this._subscribe,unsubscribe:this._unsubscribe}}}render(){return this.props.children}componentDidUpdate(e){this._notify(this._getUpdates(this.props.values,e.values))}_notify(e){this._subscriptions.forEach(t=>t(e))}_getUpdates(e,t){
return[...t,...e].filter(n=>t.includes(n)?!e.includes(n):e.includes(n))}}function i(e){var t;return(t=class extends s.PureComponent{constructor(){super(...arguments),this._onChange=e=>{this.context.switchGroupContext.getOnChange()(e)},this._onUpdate=e=>{e.includes(this.props.value)&&this.forceUpdate()}}componentDidMount(){this.context.switchGroupContext.subscribe(this._onUpdate)}render(){return s.createElement(e,{...this.props,name:this._getName(),onChange:this._onChange,checked:this._isChecked()})}componentWillUnmount(){this.context.switchGroupContext.unsubscribe(this._onUpdate)}_getName(){return this.context.switchGroupContext.getName()}_isChecked(){return this.context.switchGroupContext.getValues().includes(this.props.value)}}).contextTypes={switchGroupContext:o.any.isRequired},t}a.childContextTypes={switchGroupContext:o.any.isRequired}},3631:(e,t,n)=>{"use strict";n.d(t,{CreateConfirmDialog:()=>i});var s=n(67294),o=n(9187);const a=s.lazy(async()=>({default:(await Promise.all([n.e(8193),n.e(706),n.e(4078),n.e(83),n.e(2273),n.e(9602),n.e(4882),n.e(1274),n.e(5514),n.e(268),n.e(4956),n.e(6848),n.e(3566)]).then(n.bind(n,44956))).AdaptiveConfirmDialog})),i=(0,o.withDialogLazyLoad)(a)},85111:(e,t,n)=>{"use strict";n.r(t),n.d(t,{ConfirmDialogRenderer:()=>h});var s=n(73935),o=n(67294),a=n(74245),i=n(18270),r=n(3631),c=n(69397),l=n(69749),u=n(83254);class h{constructor(e){this._root=document.createElement("div"),this._disabledConfirmations=e}open(e){return new Promise(t=>{this._open(t,e)})}_open(e,t){const{title:n,message:a,confirmButton:i,closeButton:r,showDisableConfirmationsCheckbox:h,onOpen:p,onClose:d}=t,b=()=>{e({status:!1}),null==d||d(),this._close()},C={className:u.dialog,isOpened:!0,backdrop:!0,showSeparator:!0,title:n,cancelButtonText:r,submitButtonText:i,onSubmit:t=>{if(t){const e=(0,l.makeConfirmation)(a);void 0!==e&&this._disabledConfirmations.add(e)}e({status:!0}),null==d||d(),this._close()},onOpen:p,onClose:b,onKeyDown:e=>{27===(0,c.hashFromEvent)(e)&&b()},onCancel:()=>{},dataName:"trading-confirm-dialog",defaultActionOnClose:"none",showDisableConfirmationsCheckbox:h,message:a};s.render(o.createElement(m,{...C}),this._root)}_close(){s.unmountComponentAtNode(this._root)}}function m(e){const{showDisableConfirmationsCheckbox:t,message:n,onSubmit:s,...c}=e,[l,h]=(0,o.useState)(!1),m=()=>h(!l);return o.createElement(r.CreateConfirmDialog,{...c,render:()=>o.createElement(o.Fragment,null,o.createElement("p",{className:t?u.messageWithCheckbox:u.message},Array.isArray(n)?n.map((e,t)=>o.createElement("span",{className:u.messageBlock,key:t},e)):n),e.showDisableConfirmationsCheckbox&&o.createElement(i.Checkbox,{className:u.checkbox,label:(0,a.t)("Don't ask again"),checked:l,onChange:m})),onSubmit:()=>s(l),isOpen:!0})}},32944:(e,t,n)=>{"use strict";n.r(t),n.d(t,{SimpleConfirmDialog:()=>h});var s=n(67294),o=n(74245),a=n(18270),i=n(78118),r=n(21659),c=n(66183);function l(e){return s.createElement(s.Fragment,null,s.createElement(r.Icon,{icon:e.icon,className:c.icon}),e.text)}var u=n(57810);function h(e){
const{disabledConfirmations:t,title:n,titleIcon:r,text:c,mainButtonText:h,mainButtonIntent:m,cancelButtonText:p,showDisableConfirmationsCheckbox:d,checkboxLabel:b,showCancelButton:C=!0,onClose:g=(()=>{}),onConfirm:x,onCancel:f,showBackdrop:k}=e,[w,_]=(0,s.useState)(!1),v=s.createElement(s.Fragment,null,s.createElement("div",{className:u.text,dangerouslySetInnerHTML:{__html:c}}),d&&s.createElement(a.Checkbox,{className:u.checkbox,label:null!=b?b:(0,o.t)("Don't ask again"),checked:w,tabIndex:-1,onChange:()=>_(e=>!e)}));return s.createElement(i.SimpleDialog,{title:function(){const e=null!=n?n:(0,o.t)("Confirmation");if(void 0===r)return e;return s.createElement(l,{text:e,icon:r})}(),content:v,onClose:g,actions:function(){const e=[{name:"yes",title:null!=h?h:(0,o.t)("Yes"),intent:null!=m?m:"success",handler:N}];C&&e.push({name:"no",title:null!=p?p:(0,o.t)("No"),appearance:"stroke",intent:"default",handler:E});return e}(),dataName:"simple-confirm-dialog",backdrop:k});function N(e){void 0!==t&&w&&t.add(c),x(e)}function E(e){void 0!==f?f(e):e.dialogClose()}}},9187:(e,t,n)=>{"use strict";n.d(t,{withDialogLazyLoad:()=>a});var s=n(67294),o=n(89865);function a(e){return t=>{const n=(0,o.useIsMounted)();return((e=>{const[t,n]=(0,s.useState)(!1);return(0,s.useEffect)(()=>{!t&&e&&n(!0)},[e]),t})(t.isOpen)||t.isOpen)&&n?s.createElement(s.Suspense,{fallback:null},s.createElement(e,{...t})):null}}},7536:e=>{e.exports='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 11 9" width="11" height="9" fill="none"><path stroke-width="2" d="M0.999878 4L3.99988 7L9.99988 1"/></svg>'}}]);