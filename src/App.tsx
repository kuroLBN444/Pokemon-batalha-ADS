import { useState } from "react"

interface Pokemon {
  nome: string
  hp: number
  ataque: number
  defesa: number
  img: string
}

async function buscarPokemon(nome: string): Promise<Pokemon> {
  const resposta = await fetch(
    `https://pokeapi.co/api/v2/pokemon/${nome.toLowerCase().trim()}`
  )
  if (!resposta.ok) throw new Error("Pokémon não encontrado")
  const dados = await resposta.json()
  return {
    nome: dados.name,
    hp: dados.stats[0].base_stat,
    ataque: dados.stats[1].base_stat,
    defesa: dados.stats[2].base_stat,
    img:
      dados.sprites.other.home.front_default ?? dados.sprites.front_default,
  }
}

function Carta({ pokemon, hp }: { pokemon: Pokemon; hp: number }) {
  return (
    <div>
      <h2>{pokemon.nome}</h2>
      <img src={pokemon.img} alt={pokemon.nome} width={200} />
      <p>
        HP: {hp} / {pokemon.hp}
      </p>
      <p>Ataque: {pokemon.ataque}</p>
      <p>Defesa: {pokemon.defesa}</p>
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

  async function iniciar(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    try {
      const [p1, p2] = await Promise.all([
        buscarPokemon(nomeJogador),
        buscarPokemon(nomeOponente),
      ])
      setJogador(p1)
      setOponente(p2)
      setHpJogador(p1.hp)
      setHpOponente(p2.hp)
      setLog([`${p1.nome} vs ${p2.nome}!`])
    } catch {
      setErro("Pokémon não encontrado")
    }
  }

  // Fórmula simples de dano (pode ajustar depois)
  function calcularDano(atacante: Pokemon, defensor: Pokemon) {
    return Math.max(1, Math.round((atacante.ataque - defensor.defesa / 2) / 3))
  }

  function atacar() {
    if (!jogador || !oponente) return
    if (hpJogador <= 0 || hpOponente <= 0) return

    const danoJogador = calcularDano(jogador, oponente)
    const novoHpOponente = Math.max(0, hpOponente - danoJogador)
    setHpOponente(novoHpOponente)
    const mensagens = [`${jogador.nome} causou ${danoJogador} de dano`]

    if (novoHpOponente === 0) {
      mensagens.push(`${jogador.nome} venceu!`)
    } else {
      const danoOponente = calcularDano(oponente, jogador)
      const novoHpJogador = Math.max(0, hpJogador - danoOponente)
      setHpJogador(novoHpJogador)
      mensagens.push(`${oponente.nome} causou ${danoOponente} de dano`)
      if (novoHpJogador === 0) mensagens.push(`${oponente.nome} venceu!`)
    }

    setLog([...log, ...mensagens])
  }

  const fimDeJogo = hpJogador <= 0 || hpOponente <= 0

  return (
    <>
      <form onSubmit={iniciar}>
        <input
          type="text"
          placeholder="Seu pokémon"
          onChange={(e) => setNomeJogador(e.target.value)}
        />
        <input
          type="text"
          placeholder="Oponente"
          onChange={(e) => setNomeOponente(e.target.value)}
        />
        <button type="submit">Iniciar batalha</button>
      </form>

      {erro && <p>{erro}</p>}

      {jogador && oponente && (
        <>
          <div style={{ display: "flex", justifyContent: "space-around" }}>
            <Carta pokemon={jogador} hp={hpJogador} />
            <Carta pokemon={oponente} hp={hpOponente} />
          </div>

          <button onClick={atacar} disabled={fimDeJogo}>
            Atacar
          </button>

          {log.map((linha, i) => (
            <p key={i}>{linha}</p>
          ))}
        </>
      )}
    </>
  )
}

export default App