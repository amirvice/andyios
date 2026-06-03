import React from 'react'

export default function Placeholder({ titulo, sub }) {
  return (
    <>
      <div className="topbar">
        <div><h1>{titulo}</h1><div className="sub">{sub}</div></div>
      </div>
      <div className="content">
        <div className="empty">
          <div className="empty-ico">🚧</div>
          <b>Pantalla por construir</b>
          <p>Esta sección llegará en una próxima fase.</p>
        </div>
      </div>
    </>
  )
}
