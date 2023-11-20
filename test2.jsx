<JSXComponent>
    <UIHeader>
        <Banner class={className1}/>
        <Toolbar onclick={onclick1}>
        </Toolbar>
    </UIHeader>
    <Paper class={className2}>
        <Content class={className3.join(" ")}/>
    </Paper>
    <Sidebar>
        <TOC id={id1}/>
        {testArr.forEach((item)=>{
            <Item>{item} from {testArr} </Item>
        })}
    </Sidebar>
    <nav>
        <h1> JSX Test </h1>
        <Divider />
        {testText1}
    </nav>
</JSXComponent>
