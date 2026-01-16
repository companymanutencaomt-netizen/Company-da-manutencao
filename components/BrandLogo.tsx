
import React from 'react';

const BrandLogo: React.FC<{ size?: number; className?: string; withText?: boolean }> = ({ size = 32, className = "", withText = false }) => {
  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Fundo Circular - Representando o globo de serviços */}
          {/* Hidráulica - Azul Escuro */}
          <path d="M25 75C15 65 10 50 10 35L25 40C25 50 28 60 35 68L25 75Z" fill="#074776"/>
          {/* Fogo/Calor - Laranja */}
          <path d="M15 30C20 15 35 5 50 5L50 20C42 20 33 25 28 33L15 30Z" fill="#F37021"/>
          {/* Geral/Gás - Amarelo/Ouro */}
          <path d="M55 5C70 7 82 18 88 32L75 38C72 30 65 23 55 20L55 5Z" fill="#FFB81C"/>
          {/* Refrigeração - Azul Claro */}
          <path d="M92 38C95 45 95 55 92 65L78 60C80 55 80 48 78 42L92 38Z" fill="#89D3F4"/>
          
          {/* Estrutura Central - Representando o Edifício/Condomínio */}
          {/* Telhado e Base da Casa - Vermelho Vibrante */}
          <path d="M50 25L90 65H75V85H55V65H45V85H25V65H10L50 25Z" fill="#E31E24"/>
          
          {/* Janelas (Negativo) */}
          <rect x="60" y="68" width="6" height="6" fill="white"/>
          <rect x="68" y="68" width="6" height="6" fill="white"/>
          <rect x="60" y="76" width="6" height="6" fill="white"/>
          <rect x="68" y="76" width="6" height="6" fill="white"/>

          {/* Ícone Elétrica (Raio Centralizado na Base) */}
          <path d="M50 72L46 84H50L48 95L56 81H50L53 72H50Z" fill="#E31E24" stroke="white" strokeWidth="0.5"/>

          {/* Ícone Hidráulica (Gota Estilizada) */}
          <path d="M22 46C22 46 19 52 19 55C19 58 20.5 59.5 22.5 59.5C24.5 59.5 26 58 26 55C26 52 22 46 22 46Z" fill="#074776"/>
          
          {/* Chave/Martelo (Sobreposição Amarela) */}
          <path d="M38 48L32 54L44 66L50 60L38 48Z" fill="#FFB81C"/>
          <circle cx="34" cy="51" r="3.5" fill="#FFB81C"/>
        </svg>
      </div>
      
      {withText && (
        <div className="flex flex-col items-center leading-none">
          <span className="text-lg font-black tracking-tighter text-[#074776] uppercase">COMPANY</span>
          <span className="text-[9px] font-bold text-[#074776] uppercase tracking-[0.2em] mt-0.5">
            DA MANUTENÇÃO
          </span>
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
