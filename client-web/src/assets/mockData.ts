// assets/mockData.ts
export interface HeroSlide {
  url: string;
  label: string;
  tagline: string;
  accent: string; // drives the mesh-gradient tint + spotlight color for this slide
  eyebrow: string; // small kicker text, e.g. "NEW" or "CLASSIC"
}

export const MockAssets = {
  // Rotating hero devices. Mostly current-generation 2026 flagships, with a
  // couple of nostalgic classics mixed in for visual range. These are stock
  // placeholder photos — swap for real product photography when available.
  heroSlides: [
    {
      url: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxAQEBAQDxIPEg8PDg8NDQ0QDxAPDQ8PFRUWFhURFRUYHSggGBomHRUVITEhJSk3Li4uFx8zODMsNyotLisBCgoKDg0OGhAQGi0lHyUtLSstKy0rLy0tLS0tLS0tLS0tLS0tLS0tLy0rLS8tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAOEA4QMBEQACEQEDEQH/xAAcAAEAAQUBAQAAAAAAAAAAAAAAAQIDBQYHBAj/xABREAABAwIABgoPAgwFBQEAAAABAAIDBBEFBhIhMUEHExQVUVJhcYHSIjIzU1RzkZKTlKGxs9HTFyMWNEJVYmNydKKjssEIgoOVwkN1hMPwJP/EABoBAQACAwEAAAAAAAAAAAAAAAABBAIDBQb/xAA2EQEAAQEDBwsFAQACAwAAAAAAAQIDERIEEyExUXHBFCIyM0FSYYGRofAFFbHR4WIj8UKCkv/aAAwDAQACEQMRAD8A7igICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICCxUVbWadWkC2bnJzBa67WmjWzos6qtTwOw0PyWg/wCZ39mlVpyynshZjI57Z+eqnfs979snUUct/wA/PRPI/wDX4/aN/P1ftk6ict/z89E8i8fx+zf39D2ydROWx3fnocinb+P2b/Die2TqJy2O789DkU7fx+0b/jie2TqJy2O789DkU7fx+1LsYmjSz2v6icujZ89E8hq2/j9sVX4+MhDnOge5rdcT9sdb9kC6U5dFU3Xessp+nVRTff7MT9r9H3ir9BL1FYzlWyPVVzVO2fT+n2v0feKv0EvVTHVsj1M3Ttn0T9r9H3ir9BJ1VOOrZHqZunbP/wA/0+1+i7xV+gl6qY6tkeqM3Ttn0/p9r9F3mr9BN1VGcq2R6pzVO2fT+pbsu0RPcaoDh2if+zFGdq2e8JzNO2fRseLuOtDX5qeUZeja3di+/BY6DyHOsqbWJm6dE+Py5hVYzEYo0x4cY1tiW1qEBAQEBAQEBAQEBBZq5shpOskNHOdfRp6FhaV4ab2dFOKq5r9TUsYwzSkBoBe3LPYMYNL3cJK5l9/OnTfqh0Ipu5saNs/OxzfCOy1CJC2JlQ9gNtsBYxp5WsJ0Lbya1mL74hjGU2NM3Yb2ewJjU2rYHRSHPcWOZwI0tI1HOM3LcXGdVLSLSzm6pesosbWnFRDJbtk4xWrOVbW3M0bFLq2XjlRnKtqYsaNi26ul459iZyranM0bFDsIS8c+xM5VtMzRsWJcJS63n2JjqllFjRHYwWFXuF5BnH5fCBw31jhU06W3U0TGtm15M0bIbOeY5Q6nge7LILmuJc0nU4f5Qr+TVX82ZczLrOKZiuI162pOwtLftafm3JS9RX8EfJlyZtavkIGFpeCn9UpeomCPkyZ2r5ELseFJM2anOe2TuSl0eYk2dN39lMWtV70b4P4lP6pTdRa8PjPq24/BLcIuBvtdMeekpuoow+M+pi8I9GxUGFYpIpJMkw1kAbJBPG5xb2wGS4G5yCSAW3t2VwAtM0zTOGdMS30zFUYo0TD6A2PsP7voIZ3d0tkSi9zljMfbcX1kFWbKqZi6dcfPwp21MRMTGqdP7j1bItrUICAgICAgICAgIMPjNLkRMOfuhGYXPc5FTy2brPz4SuZDTitPLjDm2ytVPODn5GUGukgbJqIjyg2x5CclVsmmJtY3LOU0zTYz81y4zEwWN9Org6V14cpnsUql8Ury3tfuT/qba1o6ch8vRdU8siJiPP8AH/TofTpmK52XcXY2drlGwaBdziQ1o5ydC4sRM6nXqqinW8zauN3aPY4XsSx7XAHguEmmqNcJpqirVKXFQzWXlEspi9tRDw/IDy4dk+2ZltV+W66eRVURRMaL3Jy+i0muJum7wYbC4iMsjY7GInJFu1IsAbcl7qlbTTnJmjU6OTxXmqcetz3C1SGwzXcWWdA7LETZbOIsexdYZ8o+VWbCOdGja05Z1eu7U101w8Id/t9L1ldu8PeXIv8A9e0I3a3wg/7fS9ZLvD3k0d72gFa3wh3qFL1ku8PeU3/69oTu8eEP9QpesmH/AD7yX/69lyGcyENZLFK45mwz0cUTZCfyRJGSWngzjnSYiNcXeaYvnVN++Hoo6IGGepiBEG5alkrHZ3QzhobtROvsnxkHl4QVEzOKKZTF2Caodi2Bpb0lU3PZlU8DgsXyFZ2fTndHFqterpnxq4OnreriAgICAgICAgICDDY09yZ4x3wpFSy/q/PhK9kHW+XGGt4WpWzMfE8Ate0tIcLtIOaxGsLnTMxMTDo0RExdOpyXC2JLonnIFTkXzNbHHOLcAfltPlF+dX6MtmY0xH4Vavp1MzfTVo3Mriziw8Pa6RhjjY7LaxxDpHv0B7yM2YEgAZhc6SSTWt8ov3rlhYRZRdDFbIWFnT1po3PMdLTObHaxLS/JDnSFo7Y57DmV7IrKIoie2XJyy1mquY7GpUs74JNsiOS5vauAzObxXDW06wrVdEVRdVqVbOuqicVOiXWMX8LbczPe4Ebhc3Ia9jXgX12yrX5F5+2s8FT09jXnKYqZJ71qbbnnkclydS0XINDxk/F6n/w/+C6OTdOPNQy/qp8mkrouKICAguU57Ic6xq1MqNcNkbWObT4bhHay1NOSOAidx+XkWun/AMJ8ODZVoxx4uw7AY/8Ax1P72/8Aqcs7PpzujiwtehTvq4OoLcriAgICAgICAgICDD4zj7pnjD8KRUsu6vz4Su5B1nlxhq+HcJRUkMtTNcsiA7EZnPeTZrBzlUaLOa64phdqtMFF7kVdsjV0khLXRRtv2MLYmuaBwFzhc8+ZdGMisrtKhy21vvibm14pY3CpGTKA2QOa19r5N3XyXtvnsbEWOg2zm4tz8pybNzfGp08lynP0zfrhgdkDF576g1EIDttDdsiuA4vaLZTL5nZgLtGfNfPfNZyPKYinBV2KuWZHVNWOjTthrG5Jg0Mla6GMOLiZGFjydeS053nNoHs0q5Vb09k37lSjJbSdcXR4t0xWic1rnkFuWRksOlrGtDGA8uS0LkZRVfNzvZPRhpbAZFXWHkq66KO22SMZlaMt4bfmusqbOqroxe112lFHSmIVZV7W0HQdVlizaVjEwmnqrAmwpHOsCbNuzOeRX8n0V0+ahlumynyaXkLoXuRcZCXlxkJeXGQl5cuU8fZDnCxrnmyzs450MzIy8eGDwVMAPTO8LGnVRu4Jr12m92rYF/E6r98k/qcs7PpTuji1WvQjfPB05bmgQEBAQEBAQEBAQYnGQfds8Y74Uip5b1cb+ErmRdZO7jDl+P7H1VFPHFd0kUsUxjGdzmjPmGvNldICpZLaRFpEzuX8rsJmymI3uQ0rxnDjeNxyyBrdYgG/SV24cRlsAMcHl7bjbHMijGs2kZI49AYAf2wqeVVRMXebo/T6JxTV5OozBsjMl4DgRnBFwuLEzE3w7lzDjAdO12U2NoPMtuermNaM3Tffc9QaBoWvWzLqBqeNOBqiaYSRNy2ljWWymtLCL8YjNn966WSW9nRRhqm5ycuya1rrxUxfDN4PhNNTMbIQTFGS8g5tJOSOa9hzKnbVRaWszT2ruT0TZ2UU1djBkGWCsABJfHExoAuXFrmjN5Ct18UVUzPiwtKZrpmIa9vHN3t/mlbuVUbVPklew3jm72/zSnKqNpySvYbxzd7f5pTlVG05JXsN45u9v80pyqjackr2PRR4CkDg+RpZGwh0krxksY0aSSVjVlEVRhp0zLKnJ5onFVoiFylAdgzC9VobUV1KyG+kkSOkcPI9qtxoroo2QoTzqa69suwbBLbUlUOCtlH8TllZ9Kd0cWNr0I31cHTVvVxAQEBAQEBAQEBBi8P9pH4w/CkVTLOhG/hK3knTndxhzfCFMdsy2HJcAWnWHN4pGsLj33PQU6Y0tawjgASPLw2lLiblz2kPJ4TYtDud1zwkqxRlNURdfLTXktjVN+GFzBmCBE7LcWveBkg5cbWsbqa1ozNHIFjXaTVobKKKaWX208DfSNWnC24oUlxPE9I1LjFCkg/oekapuMUIDT+h6RqXMcUIc0gX7D0gS4xMBhKKad2S4hsQN8lt854Sda30TRRp7WuqKqtHYtz0zGwzB0r4GMjjcZYy5rwA7UWgnPfgWdnVM1xov1tWU0RFnOm5hMuk/OdZ6af6Su87uR6OXdT359TLpPznWemn+knO7kehdR359TLpPznWemn+knO7kehdR359UGSk/OdZ6WoP/qTndyC6jvz6rUm9hIM1VWVAbnDC6VwJ4M8Y9jhzrKM52REMZiy7aplfmqHV+1QwxbnwZTOy3EgNyjnvyZVi4BoJN3Ekm9xhN1nEzM31SyiJtJiIi6mHXdgqTKpKt2jKrZXW4LucVtsulO6OLRbdGN9XB0xb1cQEBAQEBAQEBAQYbGJxvCNRdLfojcqeWao+di7kcaavL8w0eo7JxA6TqC41Uu9RGhbNGDpPkFljiZ3KTg9nL7ExyXI3uZwn2KcclxvczhPsTFIg4OZwn2fJTikuRvezl9nyUYpLkGgZy+xTiLnlqcH2F25+S2dTEpa3hh2RDVGzXWhZ2L2hzT2Y0g6VZselTv4K+U9Cfna0rd/6im9XYr+na5ehO7/1FN6uxRp2mjYbv/U03oGJp2mjYjdx7zTegYnnJo2JGEXjtY6cc1ND/dqjD4z6pvjYyeBzPWTxxOe43Os2YxulxtoaABdYVRFMXs6Zvm513YQiMcFXFcHa62oZcaCWyEX9isWU31+UKVtHM/8AaXTVZVRAQEBAQEBAQEBBg8ZTng/am+E5Uss1R5/heyHXV5fmGlxazwuPvt/ZcOqdL0MRcrUJSiBSClCCpFJRKCgoKJafjQ1zWVBZI2ItYx2W9peyweMxAB9xVvJrpqiJi/8A6VMrvzd8S0rd0vhlL6B/0V0cMd2fnm5ecnvQbul8MpfQP+iowR3Z+eZnJ2wnd0vhlL6F/wBFMFPdn55mcq2wbul8NpfQSfRTBHdn55pzk7YVsrZtVZRHkdAbfxQKMNPdn55mcq2wuVWG6unYWmOna2ZpZuqnjjtK3W0PZm5xmPCkWVNWqfIm2qp1w67sDS5dLUPOl9TM89L7rbZxdaTHhCvazfZ3/wCpdTVhVEBAQEBAQEBAQEGExnZ2MTtQfILc8T/kqeWxzYn5qXshnnTG78w0mE5uk+8rgzreiVqBN1IXRApEEqRCCkqUqSg0/HCUsjq3ANJEDSA5oe3txpBzFW8li+unfwU8tm6xqn5rhzbfeTiU3qsHVXWzcfJcPOVG+8nEpvVYOqmCPkmcqN95OJTeqwdVM3BnKvkQb8ScSm9Vg6qZuPkmcqTvu49vFTubraIWxG3I5liCmbjsmTOT2vdTOZDOIHFzqKrbG4td2wZILtk5HsJ08h1FYTfVTi7YbImIm7sl2zYGpHRUlQxxF4qqWF1tbmuIuPIVlRptJnwhrtNFnEeM8HUVvVxAQEBAQEBAQEBBhsaO5R+Nd8KVVMt6uN/CV3IesndxhosHajp95XAnW9IuKAUoLoCkFKEFEqSgpKDRNkMnaZ7XziAHlG2DMr2RdOPP8KP1Dqp+drmdl13EuLKC4spLkxsLjktBc7itBLvIEQ9kGB6qRwayCck5h908DnJIsBynMsZqpjXKYpmdUL+MEjdvjjjcHimhhptsabte9g7NzTrGUXWWNn0Zme29laaJiI7H0FsMdxr/APuVR8R6WXSndHFFt0Y31cHRVvVxAQEBAQEBAQEBBhcae5R+Nd8GVU8t6uN/CV3IOsndxho0Hajp95XBnW9IuIIQEQKQugpKkQUFJRLSsd4TI2VoFydpzcz7q5kk3VRO9TyunFRc0fel/FPkXSzkObmJ2J3ok4p8iZyDMTsZHBuLtmSVVS1wpacAvAOS6aQ5mQtOq50nUAddljNpfop1yibKKdNTywYUqphds+5KfbDHHDTtLAXWByWMZbKIu25cdeklbc1TE3TF8q2eqnTE3Qqwm+Nl2S4RrZ3Alr4GREtB1tc90tvICsqbOOymGNVpPbVLx4v4IfUztyGERtNzfObcJPCs6+bTN7CjnVxc+g9iBtmYSHBhSqH8161WWud0cWy26Mb6uDoK3q4gICAgICAgICAgwmNfco/Gu+DKqeXdXG/hK9kHWTu4w0an7UdPvK4UvRrigRdAQQ51s6kiL0A5kAlBSSpEEoMBW4VNJUOnABLWtbZwBHZEjQedWrCJnoq2U4cPO1J+0d/Fi9Gz5K3htdqhfY/Lz7R3cWL0bPkmC1L7FhcbcbHV0BhdYNByg1oDRfmCys7OuK4qnsY2lVngmKe1o2D3EtELTaeKUz0vBITk5Uf7XYNLeHONJC6FcYZxdjl06Yw9salt4a4vmiGsvnpyOziz53N4zL9I18Jzpqu0Swqi/S2nF/GlsUeQGtF9JAzlV8os6p0wsZPaUxol17YalD4sIPGh+Eqlw5jI8qLLXO6OJbdGN9XB0Rb1cQEBAQEBAQEBAQYTGzuUfjXfBlVPLurjfwleyDrJ3cYaJT9qOn3lcKXo126gQgolfYImIvWdtP8A8EZXK4nE6VLGVZKCklBBKDR8e32jmPBtP9a6X0+L7SPP8Od9S0WM+X5c/wB1ld3BDzmcqN1lMEGcqQaspggzlSxK++fXpB13SaYuuRfN972ulMoNRGS2qhAfPk/9Vl7beP0s4DhrvfjKvdh0djdfi09q1NZzNviGTZwbURN7Vjjoe3gY7g1HNrCyieyWMxfF8O/f4fX5VBOTrqnHykrVT053Rxba+rp3zwdSW1pEBAQEBAQEBAQEGDxs7lH413wZVTy7q438JXvp/WTu4w0SnPYjp95XCnW9GuXUCLolbm0cyEPPdSyXInakYyu3QUkolQSg0rHhrXRzB7shv3N35Jdbs+ALoZFN1cXeLnfUdNlLn25oPCf5Ei7GOrY4GCnabmg8I/kSJjq2GCnabmg8I/kPTHVsMNO03PB4R/IemOrYYadq9TyU8OU9sj5XmKWJjBFkMvIwsLnOLr2AcTYDTZYziq0XJjDTpvebA8obK1rs8cv3Mo4WPzX5wbOHK0KatSKJ03PoL/D4wtoJ2nS2pc084JBWFPTq3RxZ19XTvng6mtrSICAgICAgICAgIMHjb3KPxrvgyqnl3Vxv4SvfT+sndxhoMB7EdPvK4UvSLl1AXQU3RKnJHApvAADQhcglQlSSgoJUoaZjuGGKbLLmt+6u5jA93b5sxcPeuhkXTi7xc76jdmZv+aXPtppu+1Hq0f1l2Ods9/48/dTt9v6bTTd9qPVo/rKOds9/4XU7fb+m0U3faj1aP6yc7Z7/AMTdTtn0/ptFL32o9Vj+snO2e/8AC6nbPp/VceD4pOxglcZc+TFLFtRkzXyWFrnDK5Da/Ol8xrgwxOqWOabEHgN1kwfSmwP+KVX75J/U5aaOnO6OLfadCN88HTluaBAQEBAQEBAQEBBg8be5R+Nd8GVUsu6uN/CV76f1k7uMOfwnN0n3lcOXpFd1CUXRKLoF0FJKCCUFBcpFBcpiGMtMx77hP/o/1hdDIenHm531HqZ8vy5xZdrE4FxZMRcWTEi4smIue7AbSaqmt4RCegPBKwrnmyzojnQxqlrfSewL+J1X73J/U5abPpzuji32nQjfPB09bmgQEBAQEBAQEBAQYPG3uUfjXfBlVLLurjfwle+n9ZO7jDnkRzdJ95XDl6WFV1CS6CLoIugglBQSpFBcpiGKklZIajjs28Ew8T8QK7keiuPP8KOXxfZT5floG5yupicTAbnKYjAbnKYjAbnKYjAyeAactkfNbNT09ROTwEMIZ/G5ixqq1QzpouvnY18LeqPpHYCN6KpPDVPPtctNn053Rxb7ToRvng6itzQICAgICAgICAgIMFjd3GPxrvgyqll/Vxv4Sv8A07rZ3cYc6Yc3SfeVxHo1V1Ai6JvRdC9BKXF6kuU3F6kuU3IU3UoQgxkkNPJK5lUXCEtBcWWDrgkt08tlYsZwzer5RTipuXN58Ccao85nyVrPTslRzPjBvPgTjVHnM+SZ6dkmZ8YN58Ccao85nyTO1bJMzuN58Ccao85nyTO1bJMzuYTHSagpqKSGhD8uocxssjyC7a2nKyBYZgSAegLdYYq675jRDRlMRRZzp1uaQNu5o4XAe1XapuhzaYvmIfRn+H78RqBwVLve5arPpzuji3WvQjfVwdTW5XEBAQEBAQEBAQEGv46j7hmcj77SPFSKll8f8Xnwl0Pps/8ANO7jDnURzdJ95XFehVXQQiUEoKSVIglBSSiEICkanjhMY4pXA57xDyu0ewq/kURNpF/iofUZmmxmY8Glb7u4T5V2c3Q4GerN93cJ8qYKEZ6s33dwnypgoM9Wb7u4T5UwUGereatrTILEpMUxGhE11Va1/Fai2+sp4tRlBcdQY3snHyArRbTdRLZYRfaQ+gdgyEsgrRqFZIGjVmfIM3kWFl0p3RxbLfoxvq4OmrerCAgICAgICAgICDGYx0Lp6aRjM8gtJGNF3tNw2+q9iOlacos85ZzSsZLaxZWsVTqcrBAvpySTa4sWnW1w1EG+Zefuu0S9Tr0wqugglBBKXCkuQUlyCLoF1IpfIAEGhY5vfMBHE3Ku/LeQQALAhoz/ALRPkXVyOjDzpcf6laYrqKd8tV3pn4h85vzV7HDk4KjemfiHzm/NMcGCo3pn4h8rfmmODBUjeqfiHyt+aY4MFSd6pfygxg4XyxMHtdnTHBgqZ/AFOYC2RgLy5wyXgFu6XtILaeEHOW5QaXvtawt+1qtJirW3WUYdWv8AO59FbGWAn0VBG2Xu0pM0p15Ts58pLj/mWVlGiatvyGFtOmKY7Pzrlti2tIgICAgICAgICAgIMBhnFWCocZGkxSu7d7QCyQ8L2azygg5hnVW2ySztZvnRK7k+XWtjGGNMbJYR+I0mqSI8tns9nZe9Vft2ypdj6vto9/4oOIkvHj89/VT7dPeT93jue6PwEl48fnv6qfbp73sfd47nufgHLx4/Pf1VP2+e97H3eO57n4BycePz39VPt8972R92jue5+AUnHj89/VTkE972Pu0dz3R+AMnHj895/wCKfb573sfdo7nu8dXscVMgc0VMTGnQWMdl+V1x7FnRkOGb772uv6pii6IuYs7DUhzmrBOsmKAk/wApWc3V4e/7UptaJ06fb9H2Mv8ACh6GD6SYK/D3/ZnKPH2/R9jLvCh6Gn+kmCvw9/2Zyjx9v0n7GXeFD0NP9JMFfh7/ALM5R4+36Psad4UPQ0/0kwV+Hv8AtGco8fb9LkWw88H8de3lZHA13sjCZuvw9/2nO0ePt+m04ubHdHRv252XPPYDbp3F7s2jtiT0aORZRZd6b/wxm27KYu8dc+v6bitrQICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICD/9k=",
      label: "iPhone 17 Pro Max",
      tagline: "Titanium, no more. Faster than ever.",
      accent: "#ff6a00",
      eyebrow: "NEW",
    },
    {
      url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRRlSPTsWJB30AnY6VKHmg4dk1pIUSCB2MTfc1bMlzcmQ&s=10",
      label: "Galaxy S26 Ultra",
      tagline: "The Ultra, unmatched.",
      accent: "#5856d6",
      eyebrow: "NEW",
    },
    {
      url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5bwt1PVCZfshPMvCqeMAnBNSE_JN_pgjI3sZaFUkP9g&s=10",
      label: "Pixel 10 Pro XL",
      tagline: "Gemini lives here.",
      accent: "#47546A",
      eyebrow: "NEW",
    },
    {
      url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS3cRuehHDTyBRuZuJy1qEiNP4Ugo2UsCRnD5ZjOQfrBQ&s=10",
      label: "Xiaomi 17 Ultra",
      tagline: "Leica optics. Zero compromise.",
      accent: "#1FDB5E",
      eyebrow: "NEW",
    },
    {
      url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0OIdHdeHBfp-jWcbWdkDNMnMz-0tw-f_r2hyBN91Ptg&s=10",
      label: "OnePlus 15",
      tagline: "Flagship power. Honest price.",
      accent: "#C88A53",
      eyebrow: "NEW",
    },
    {
      url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTHvEC2YMRtbqF_xekuZzwiGLyRCf16ziGtF2M3-ZGGOg&s",
      label: "iPhone Air",
      tagline: "Impossibly thin. Unmistakably Apple.",
      accent: "#AEC5DB",
      eyebrow: "NEW",
    },
    {
      url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTRGX5r9uj2l-uEy-Q5mfUPBfk-542MyS1x1nbYyx88FA&s=10",
      label: "Galaxy Z Fold 8",
      tagline: "The All New Galaxy Fold 8.",
      accent: "#B48ECC",
      eyebrow: "NEW",
    },
    {
      url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRSTDOpylJ5noxNvsJOKOA7pES8X8xf_xVfbXrAfScvg&s=10",
      label: "Oppo Find X9 Ultra",
      tagline: "Zoom into everything.",
      accent: "#11B73D",
      eyebrow: "NEW",
    },
    {
      url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSk7KW186-lMpWx9x8_zZA5xP-1CpyMUQ0f6IWyD6_z6Q&s=10",
      label: "iPhone 14 pro",
      tagline: "Still iconic. Still incredible value.",
      accent: "#004FE3",
      eyebrow: "CLASSIC",
    },
    {
      url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTM1n2C5quRvEAX6A_KzKG_xLbWTIH-Jm981G9PULcXjw&s=10",
      label: "Galaxy S21",
      tagline: "The one that started the true Ultra era.",
      accent: "#E5476D",
      eyebrow: "CLASSIC",
    },
  ] as HeroSlide[],

  // Brand marquee strip — social-proof ticker under the stats bar
  brandTicker: [
    "APPLE", "SAMSUNG", "GOOGLE", "XIAOMI", "ONEPLUS", "OPPO", "HONOR", "MOTOROLA",
  ],

   devices: {
    iphone15:
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=800&auto=format&fit=crop",
    samsungS24:
      "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=800&auto=format&fit=crop",
    pixel8:
      "https://images.unsplash.com/photo-1598327105026-7820a2bba1a9?q=80&w=800&auto=format&fit=crop",
  },
};
 