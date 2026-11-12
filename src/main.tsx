import React,{Component,type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './styles.css';
class ErrorBoundary extends Component<{children:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return{failed:true};}render(){if(this.state.failed)return <main className="shell"><h1>주방을 다시 열어 주세요</h1><p>화면을 준비하다 문제가 생겼어요. 학습 기록은 기기에 남아 있습니다.</p><button onClick={()=>location.reload()}>다시 열기</button></main>;return this.props.children;}}
createRoot(document.getElementById('root')!).render(<React.StrictMode><ErrorBoundary><App/></ErrorBoundary></React.StrictMode>);
