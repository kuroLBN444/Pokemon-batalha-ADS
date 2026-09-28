import { useState, type FormEvent } from "react"
import "./App.css"

interface Pokemon {
  nome: string
  hp: number
  ataque: number
  defesa: number
  velocidade: number
  img: string
}

// Quantidade de pokémon com número "normal" na PokeAPI (ids 1 a 1025)
const TOTAL_POKEMON = 1025

function capitalizar(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

async function buscarPokemon(nome: string): Promise<Pokemon> {
  const resposta = await fetch(
    `https://pokeapi.co/api/v2/pokemon/${nome.toLowerCase().trim()}`
  )
  if (!resposta.ok) throw new Error("Pokémon não encontrado")
  const dados = await resposta.json()
  return {
    nome: capitalizar(dados.name),
    hp: dados.stats[0].base_stat,
    ataque: dados.stats[1].base_stat,
    defesa: dados.stats[2].base_stat,
    velocidade: dados.stats[5].base_stat,
    img:
      dados.sprites.other?.home?.front_default ??
      dados.sprites.front_default ??
      "",
  }
}

// Fórmula simples de dano (pode ajustar depois)
function calcularDano(atacante: Pokemon, defensor: Pokemon) {
  return Math.max(1, Math.round((atacante.ataque - defensor.defesa / 2) / 3))
}

function golpear(atacante: Pokemon, defensor: Pokemon, hpDefensor: number) {
  const dano = calcularDano(atacante, defensor)
  return {
    novoHp: Math.max(0, hpDefensor - dano),
    mensagem: `${atacante.nome} causou ${dano} de dano`,
  }
}

function mensagemInicial(p1: Pokemon, p2: Pokemon) {
  const primeiro = p1.velocidade >= p2.velocidade ? p1 : p2
  return [
    `${p1.nome} vs ${p2.nome}!`,
    `${primeiro.nome} é mais rápido e ataca primeiro.`,
  ]
}

function Carta({ pokemon, hp }: { pokemon: Pokemon; hp: number }) {
  const porcentagem = Math.round((hp / pokemon.hp) * 100)
  const nivel = porcentagem > 50 ? "alta" : porcentagem > 20 ? "media" : "baixa"

  return (
    <div className={`carta ${hp === 0 ? "derrotado" : ""}`}>
      <h2>{pokemon.nome}</h2>
      <div
        className="barra-vida"
        role="progressbar"
        aria-label={`Vida de ${pokemon.nome}`}
        aria-valuenow={hp}
        aria-valuemin={0}
        aria-valuemax={pokemon.hp}
      >
        <div
          className={`barra-vida-nivel ${nivel}`}
          style={{ width: `${porcentagem}%` }}
        />
      </div>
      <p className="hp-texto">
        HP {hp} / {pokemon.hp}
      </p>
      <div className="palco">
        {pokemon.img && <img src={pokemon.img} alt={pokemon.nome} />}
      </div>
      <ul className="stats">
        <li>Ataque {pokemon.ataque}</li>
        <li>Defesa {pokemon.defesa}</li>
        <li>Velocidade {pokemon.velocidade}</li>
      </ul>
    </div>
  )
}

function App() {
  const [nomeJogador, setNomeJogador] = useState<string>("")
  const [nomeOponente, setNomeOponente] = useState<string>("")
  const [jogador, setJogador] = useState<Pokemon | null>(null)
  const [oponente, setOponente] = useState<Pokemon | null>(null)
  const [hpJogador, setHpJogador] = useState<number>(0)
  const [hpOponente, setHpOponente] = useState<number>(0)
  const [log, setLog] = useState<string[]>([])
  const [erro, setErro] = useState<string>("")
  const [carregando, setCarregando] = useState<boolean>(false)

  // Se o oponente vier vazio, sorteia um pokémon aleatório
  async function comecar(oponenteDigitado: string) {
    if (!nomeJogador.trim()) {
      setErro("Digite o nome do seu pokémon.")
      return
    }
    setErro("")
    setCarregando(true)
    try {
      const alvo =
        oponenteDigitado.trim() ||
        String(Math.floor(Math.random() * TOTAL_POKEMON) + 1)
      const [p1, p2] = await Promise.all([
        buscarPokemon(nomeJogador),
        buscarPokemon(alvo),
      ])
      setJogador(p1)
      setOponente(p2)
      setHpJogador(p1.hp)
      setHpOponente(p2.hp)
      setLog(mensagemInicial(p1, p2))
    } catch {
      setErro("Não encontrei esse pokémon. Confira o nome (em inglês, como pikachu).")
    } finally {
      setCarregando(false)
    }
  }

  function aoEnviar(e: FormEvent) {
    e.preventDefault()
    comecar(nomeOponente)
  }

  function reiniciar() {
    if (!jogador || !oponente) return
    setHpJogador(jogador.hp)
    setHpOponente(oponente.hp)
    setLog(mensagemInicial(jogador, oponente))
  }

  function atacar() {
    if (!jogador || !oponente) return
    if (hpJogador <= 0 || hpOponente <= 0) return

    let hpJ = hpJogador
    let hpO = hpOponente
    const mensagens: string[] = []

    // Quem tem mais velocidade ataca primeiro (empate: o jogador)
    if (jogador.velocidade >= oponente.velocidade) {
      const golpe1 = golpear(jogador, oponente, hpO)
      hpO = golpe1.novoHp
      mensagens.push(golpe1.mensagem)
      if (hpO > 0) {
        const golpe2 = golpear(oponente, jogador, hpJ)
        hpJ = golpe2.novoHp
        mensagens.push(golpe2.mensagem)
      }
    } else {
      const golpe1 = golpear(oponente, jogador, hpJ)
      hpJ = golpe1.novoHp
      mensagens.push(golpe1.mensagem)
      if (hpJ > 0) {
        const golpe2 = golpear(jogador, oponente, hpO)
        hpO = golpe2.novoHp
        mensagens.push(golpe2.mensagem)
      }
    }

    setHpJogador(hpJ)
    setHpOponente(hpO)

    if (hpO === 0) mensagens.push(`${jogador.nome} venceu!`)
    else if (hpJ === 0) mensagens.push(`${oponente.nome} venceu!`)

    setLog([...log, ...mensagens])
  }

  const fimDeJogo = hpJogador <= 0 || hpOponente <= 0
  const recentes = log.slice(-5)

  return (
    <main className="batalha">
      <h1>Batalha Pokémon</h1>

      <form className="painel formulario" onSubmit={aoEnviar}>
        <input
          type="text"
          placeholder="Seu pokémon"
          value={nomeJogador}
          onChange={(e) => setNomeJogador(e.target.value)}
        />
        <input
          type="text"
          placeholder="Oponente (vazio sorteia um)"
          value={nomeOponente}
          onChange={(e) => setNomeOponente(e.target.value)}
        />
        <button type="submit" disabled={carregando}>
          Iniciar batalha
        </button>
        <button
          type="button"
          onClick={() => comecar("")}
          disabled={carregando}
        >
          Sortear oponente
        </button>
      </form>

      {erro && (
        <p className="erro" role="alert">
          {erro}
        </p>
      )}

      {jogador && oponente && (
        <>
          <section className="arena">
            <Carta pokemon={jogador} hp={hpJogador} />
            <span className="versus">vs</span>
            <Carta pokemon={oponente} hp={hpOponente} />
          </section>

          <div className="acoes">
            <button className="atacar" onClick={atacar} disabled={fimDeJogo}>
              Atacar
            </button>
            <button onClick={reiniciar}>Reiniciar batalha</button>
          </div>

          <div className="caixa-texto" aria-live="polite">
            {recentes.map((linha, i) => (
              <p key={log.length - recentes.length + i}>{linha}</p>
            ))}
          </div>
        </>
      )}
    </main>
  )
}

export default App
